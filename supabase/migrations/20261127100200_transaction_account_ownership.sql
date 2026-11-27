-- B5 (docs/arquitectura/02): a transaction could reference an account of another user in
-- account_id / transfer_to_account_id (only a FK existed). RLS cannot express this check
-- for the service role (ingestion), so it lives in a trigger that applies to everyone.
--
-- SECURITY INVOKER on purpose: under RLS a foreign account is invisible (owner = NULL),
-- and for the service role the owner is compared explicitly. Either way it is rejected.
-- The trigger name sorts before trg_transactions_balance_before, so the check runs
-- before any balance is touched. Verified on production data (2026-11-27): 0 violations.

CREATE OR REPLACE FUNCTION public.enforce_transaction_account_ownership() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT a.user_id INTO v_owner FROM public.accounts a WHERE a.id = NEW.account_id;
  IF v_owner IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'account % does not belong to the transaction owner', NEW.account_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.transfer_to_account_id IS NOT NULL THEN
    SELECT a.user_id INTO v_owner FROM public.accounts a WHERE a.id = NEW.transfer_to_account_id;
    IF v_owner IS DISTINCT FROM NEW.user_id THEN
      RAISE EXCEPTION 'destination account % does not belong to the transaction owner', NEW.transfer_to_account_id
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_transaction_account_ownership() FROM PUBLIC;

CREATE OR REPLACE TRIGGER trg_transactions_a_account_ownership
  BEFORE INSERT OR UPDATE OF account_id, transfer_to_account_id, user_id ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_transaction_account_ownership();
