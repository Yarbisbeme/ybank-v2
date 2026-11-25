-- B1: cross-currency transfers credited the destination account with the
-- source-currency amount. The app computes target_amount with the exchange rate
-- (e.g. 100 USD -> 6050 DOP) but the BEFORE trigger overwrote it with
-- `target_amount := amount`, so the DOP account received 100.
--
-- Fix: only derive target_amount from amount when the transfer is
-- same-currency (exchange_rate IS NULL). Cross-currency transfers keep the
-- converted target_amount, and fail loudly if it is missing.
--
-- The AFTER INSERT trigger had the matching problem: it used target_amount
-- (destination currency) to split the source-currency amount into
-- "Monto Transferido" + tax, producing a negative tax item. Cross-currency
-- transfers now split in source currency.
--
-- Same-currency and PayPal behaviour is unchanged. The 0.15% rule itself, and
-- the edit path (B2), are addressed in Phase 2 (docs/arquitectura/02-HALLAZGOS-BD.md).

CREATE OR REPLACE FUNCTION public.handle_transaction_before_changes() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_dgii_tax numeric := 0;
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

  -- Phase 2: derive amounts for transfers/payments (PayPal is tax-exempt).
  IF (TG_OP = 'INSERT' AND NEW.type IN ('transfer', 'payment')) OR
     (TG_OP = 'UPDATE' AND NEW.type IN ('transfer', 'payment') AND OLD.type NOT IN ('transfer', 'payment')) THEN

    IF NEW.exchange_rate IS NOT NULL AND NEW.target_amount IS NULL THEN
      RAISE EXCEPTION 'Cross-currency transfer requires target_amount (exchange_rate = %)', NEW.exchange_rate
        USING ERRCODE = 'check_violation';
    END IF;

    IF COALESCE(NEW.description, '') ILIKE '%PayPal%' THEN
      NEW.target_amount := COALESCE(NEW.target_amount, NEW.amount);
    ELSE
      v_dgii_tax := NEW.amount * 0.0015;
      -- Same currency: destination receives the pre-tax amount.
      -- Cross currency: keep the converted amount computed by the app.
      IF NEW.exchange_rate IS NULL THEN
        NEW.target_amount := NEW.amount;
      END IF;
      NEW.amount := NEW.amount + v_dgii_tax;
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


CREATE OR REPLACE FUNCTION public.handle_transaction_after_insert() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_dgii_tax numeric := 0;
  v_dgii_category_id uuid;
  v_clean_amount numeric;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM public.transaction_items
    WHERE transaction_id = NEW.id
    AND name IN ('Monto Transferido', 'Comisión DGII (0.15%)');
  END IF;

  IF (NEW.type = 'transfer' OR NEW.type = 'payment') THEN
    IF COALESCE(NEW.description, '') ILIKE '%PayPal%' THEN
      INSERT INTO public.transaction_items (transaction_id, name, quantity, unit_price, category_id)
      VALUES (NEW.id, 'Monto Transferido', 1, NEW.amount, NULL);
    ELSE
      -- Items are in the source account's currency. target_amount is only in
      -- that currency for same-currency transfers.
      IF NEW.exchange_rate IS NULL THEN
        v_clean_amount := COALESCE(NEW.target_amount, NEW.amount / 1.0015);
      ELSE
        v_clean_amount := NEW.amount / 1.0015;
      END IF;
      v_dgii_tax := NEW.amount - v_clean_amount;

      SELECT id INTO v_dgii_category_id
      FROM public.categories
      WHERE name = 'Impuestos / DGII'
      LIMIT 1;

      INSERT INTO public.transaction_items (transaction_id, name, quantity, unit_price, category_id)
      VALUES
        (NEW.id, 'Monto Transferido', 1, v_clean_amount, NULL),
        (NEW.id, 'Comisión DGII (0.15%)', 1, v_dgii_tax, v_dgii_category_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
