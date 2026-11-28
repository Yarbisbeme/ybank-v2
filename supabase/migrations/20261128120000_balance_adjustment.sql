-- Phase 2.3a: editing an account's "Balance actual" records a balance adjustment.
--
-- Bug: the account editor shows "Balance actual" and sends the new value as both
-- current_balance and initial_balance. updateAccount's schema drops current_balance, so
-- only initial_balance was saved: the balance on screen never changed and the account no
-- longer matched its history. Writing both would be wrong too: once an account has
-- movements, initial + movements would no longer equal current.
--
-- Decision (product owner, 2026-11-28): the difference becomes an "Ajuste de saldo"
-- movement dated today, flagged is_balance_adjustment so reports (spend, income, activity)
-- skip it. History is not rewritten and the reason for the jump stays visible.
--
-- transactions.exclude_from_reports is NOT reused: it is reserved for a different feature
-- (leaving whole accounts, e.g. investments, out of the net worth).
--
-- Balances are now only changed by movements: a direct UPDATE of current_balance or
-- initial_balance by a user is rejected. The transaction triggers still update them
-- (they run one trigger level deeper).

ALTER TABLE public.transactions ADD COLUMN is_balance_adjustment boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.transactions.is_balance_adjustment IS
  'Created by set_account_balance(). Moves the balance but is not income or spending: reports skip it.';

-- ---------------------------------------------------------------- guard
CREATE FUNCTION public.guard_account_balances() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Depth 1 = the UPDATE came straight from a client statement, not from another trigger.
  IF pg_trigger_depth() = 1
     AND current_user IN ('authenticated', 'anon')
     AND (NEW.current_balance IS DISTINCT FROM OLD.current_balance
          OR NEW.initial_balance IS DISTINCT FROM OLD.initial_balance) THEN
    RAISE EXCEPTION 'Account balances change only through movements; use set_account_balance()'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_accounts_guard_balances
  BEFORE UPDATE OF current_balance, initial_balance ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.guard_account_balances();

-- ---------------------------------------------------------------- adjustment
-- Sets an account's current balance by recording the difference as a movement.
-- Returns the adjustment's id, or NULL when the balance already matches.
-- SECURITY INVOKER: RLS decides which accounts the caller can adjust.
CREATE FUNCTION public.set_account_balance(p_account_id uuid, p_target numeric)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_account public.accounts%ROWTYPE;
  v_delta numeric;
  v_id uuid;
BEGIN
  IF p_target IS NULL THEN
    RAISE EXCEPTION 'Target balance is required' USING ERRCODE = 'check_violation';
  END IF;

  -- Lock the row so two concurrent adjustments cannot both compute from the same balance.
  SELECT * INTO v_account FROM public.accounts WHERE id = p_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found' USING ERRCODE = 'no_data_found';
  END IF;

  v_delta := p_target - v_account.current_balance;
  IF v_delta = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.transactions
    (user_id, account_id, type, amount, description, date, is_balance_adjustment, payment_method)
  VALUES
    (v_account.user_id, v_account.id,
     CASE WHEN v_delta > 0 THEN 'income' ELSE 'expense' END::public.transaction_type,
     abs(v_delta), 'Ajuste de saldo',
     (now() AT TIME ZONE 'America/Santo_Domingo')::date,
     true, 'other')
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.set_account_balance(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_account_balance(uuid, numeric) TO authenticated;
