-- Phase 2.2: the DGII cheque/transfer tax becomes versioned data (docs/arquitectura/03).
--
-- Before: the triggers hard-coded 0.15 % and charged it on every transfer and payment
-- except PayPal. Wrong in two ways:
--   * the rate is 0.20 % for operations from 2026-07-03 (Ley 30-26);
--   * transfers between the holder's own accounts are exempt.
--
-- Now:
--   * tax_rules holds the rate per date range; a future change is a new row, not a deploy.
--   * tax_rule_exemptions says which kinds of transfer are exempt.
--   * Each transfer/payment is classified into transactions.transfer_kind by the DB.
--   * The DGII item references the rule it applied (transaction_items.tax_rule_id).
--
-- Out of scope here: moving the tax out of `amount` and the edit path (B2) -> Phase 2.3;
-- reclassifying and correcting historical rows -> Phase 2.5. Existing rows keep
-- transfer_kind NULL until then.

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- ---------------------------------------------------------------- rules (reference data)
CREATE TABLE public.tax_rules (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL,
  rate           numeric(8,6) NOT NULL CHECK (rate > 0 AND rate < 1),
  effective_from date NOT NULL,
  effective_to   date,                    -- NULL = still in force
  legal_ref      text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  -- Two rates for the same tax on the same day would make the result depend on row order.
  CONSTRAINT tax_rules_no_overlap EXCLUDE USING gist (
    code WITH =,
    daterange(effective_from, effective_to, '[]') WITH &&
  )
);

COMMENT ON TABLE public.tax_rules IS
  'Versioned tax rates. Append a row when the law changes; never edit a rate that was already applied.';

CREATE TABLE public.tax_rule_exemptions (
  code          text NOT NULL,
  transfer_kind text NOT NULL,
  legal_ref     text NOT NULL,
  PRIMARY KEY (code, transfer_kind)
);

-- Start date of the 0.15 % rate is not modelled: every operation before the change uses it.
INSERT INTO public.tax_rules (code, rate, effective_from, effective_to, legal_ref) VALUES
  ('DO_CHEQUES_TRANSFERS', 0.001500, '-infinity', '2026-07-02', 'Código Tributario, Art. 382 (0.15 %)'),
  ('DO_CHEQUES_TRANSFERS', 0.002000, '2026-07-03', NULL,        'Ley 30-26, modifica Art. 382 CT (0.20 %)');

INSERT INTO public.tax_rule_exemptions (code, transfer_kind, legal_ref) VALUES
  ('DO_CHEQUES_TRANSFERS', 'own_accounts',    'Resolución 26-2009; Norma General 04-19 (mismo titular)'),
  ('DO_CHEQUES_TRANSFERS', 'external_wallet', 'No es transferencia bancaria local (PayPal y similares)');

-- RLS is enabled automatically (ensure_rls). Read-only for signed-in users: the transaction
-- triggers run as the caller and need to read the rules. Writes only through migrations.
CREATE POLICY tax_rules_select_all ON public.tax_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY tax_rule_exemptions_select_all ON public.tax_rule_exemptions FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------- classification
ALTER TABLE public.transactions
  ADD COLUMN transfer_kind text
  CONSTRAINT transactions_transfer_kind_check
  CHECK (transfer_kind IN ('own_accounts', 'third_party', 'own_credit_card_payment', 'external_wallet'));

COMMENT ON COLUMN public.transactions.transfer_kind IS
  'Set by the DB for transfers/payments; decides the DGII tax. NULL on rows created before Phase 2.2.';

ALTER TABLE public.transaction_items
  ADD COLUMN tax_rule_id uuid REFERENCES public.tax_rules (id);

CREATE INDEX idx_transaction_items_tax_rule ON public.transaction_items (tax_rule_id) WHERE tax_rule_id IS NOT NULL;

-- PayPal is still detected by description (the only signal today); ingestion will set it explicitly.
-- The destination is always one of the user's own accounts when present (enforced by
-- trg_transactions_a_account_ownership), so no destination means a third party.
CREATE FUNCTION public.classify_transfer(p_type public.transaction_type, p_description text, p_destination uuid)
RETURNS text
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_type NOT IN ('transfer', 'payment') THEN NULL
    WHEN coalesce(p_description, '') ILIKE '%PayPal%' THEN 'external_wallet'
    WHEN p_type = 'payment' THEN 'own_credit_card_payment'
    WHEN p_destination IS NULL THEN 'third_party'
    WHEN (SELECT a.type FROM public.accounts a WHERE a.id = p_destination) = 'credit_card' THEN 'own_credit_card_payment'
    ELSE 'own_accounts'
  END
$$;

-- The rule that applies to an operation of this kind on this date, or no row if it is exempt.
CREATE FUNCTION public.transfer_tax_rule(p_date date, p_kind text)
RETURNS TABLE (rule_id uuid, rate numeric)
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  SELECT r.id, r.rate
  FROM public.tax_rules r
  WHERE r.code = 'DO_CHEQUES_TRANSFERS'
    AND p_kind IS NOT NULL
    AND p_date BETWEEN r.effective_from AND coalesce(r.effective_to, 'infinity'::date)
    AND NOT EXISTS (
      SELECT 1 FROM public.tax_rule_exemptions e
      WHERE e.code = r.code AND e.transfer_kind = p_kind
    )
$$;

-- ---------------------------------------------------------------- triggers
-- Same three phases as before (undo OLD, derive amounts, apply NEW). Only phase 2 changes:
-- the rate comes from tax_rules and exempt kinds are not taxed.
CREATE OR REPLACE FUNCTION public.handle_transaction_before_changes() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rate numeric;
  v_old_dest_amount numeric;
BEGIN
  -- Phase 1: undo OLD's effect on balances (UPDATE / DELETE).
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    v_old_dest_amount := COALESCE(OLD.target_amount, OLD.amount / 1.0015);

    IF OLD.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF (OLD.type = 'transfer' OR OLD.type = 'payment') THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
      IF OLD.transfer_to_account_id IS NOT NULL THEN
        UPDATE public.accounts SET current_balance = current_balance - v_old_dest_amount WHERE id = OLD.transfer_to_account_id;
      END IF;
    END IF;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    NEW.transfer_kind := public.classify_transfer(NEW.type, NEW.description, NEW.transfer_to_account_id);
  END IF;

  -- Phase 2: derive amounts for transfers/payments.
  IF (TG_OP = 'INSERT' AND NEW.type IN ('transfer', 'payment')) OR
     (TG_OP = 'UPDATE' AND NEW.type IN ('transfer', 'payment') AND OLD.type NOT IN ('transfer', 'payment')) THEN

    IF NEW.exchange_rate IS NOT NULL AND NEW.target_amount IS NULL THEN
      RAISE EXCEPTION 'Cross-currency transfer requires target_amount (exchange_rate = %)', NEW.exchange_rate
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT t.rate INTO v_rate FROM public.transfer_tax_rule(NEW.date, NEW.transfer_kind) t;

    -- Same currency: destination receives the pre-tax amount.
    -- Cross currency: keep the converted amount computed by the app.
    IF NEW.exchange_rate IS NULL THEN
      NEW.target_amount := NEW.amount;
    END IF;
    IF v_rate IS NOT NULL THEN
      -- Banks charge whole cents.
      NEW.amount := NEW.amount + round(NEW.amount * v_rate, 2);
    END IF;
  END IF;

  -- Phase 3: apply NEW's effect on balances (INSERT / UPDATE).
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'transfer' OR NEW.type = 'payment') THEN
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      IF NEW.transfer_to_account_id IS NOT NULL THEN
        UPDATE public.accounts SET current_balance = current_balance + NEW.target_amount WHERE id = NEW.transfer_to_account_id;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Items: "Monto Transferido" always; the DGII item only when a rule applied.
-- Items are in the source account's currency.
CREATE OR REPLACE FUNCTION public.handle_transaction_after_insert() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rule_id uuid;
  v_rate numeric;
  v_clean_amount numeric;
  v_dgii_category_id uuid;
BEGIN
  IF NEW.type NOT IN ('transfer', 'payment') THEN
    RETURN NEW;
  END IF;

  SELECT t.rule_id, t.rate INTO v_rule_id, v_rate FROM public.transfer_tax_rule(NEW.date, NEW.transfer_kind) t;

  IF v_rule_id IS NULL THEN
    INSERT INTO public.transaction_items (transaction_id, name, quantity, unit_price, category_id)
    VALUES (NEW.id, 'Monto Transferido', 1, NEW.amount, NULL);
    RETURN NEW;
  END IF;

  -- target_amount is only in the source currency for same-currency transfers. Otherwise the
  -- pre-tax amount is recovered exactly: amount = x + round(x * rate, 2), x in cents.
  IF NEW.exchange_rate IS NULL THEN
    v_clean_amount := NEW.target_amount;
  ELSE
    v_clean_amount := round(NEW.amount / (1 + v_rate), 2);
  END IF;

  SELECT id INTO v_dgii_category_id FROM public.categories WHERE name = 'Impuestos / DGII' LIMIT 1;

  INSERT INTO public.transaction_items (transaction_id, name, quantity, unit_price, category_id, tax_rule_id)
  VALUES
    (NEW.id, 'Monto Transferido', 1, v_clean_amount, NULL, NULL),
    (NEW.id, format('Comisión DGII (%s%%)', to_char(v_rate * 100, 'FM0.00')), 1, NEW.amount - v_clean_amount, v_dgii_category_id, v_rule_id);

  RETURN NEW;
END;
$$;
