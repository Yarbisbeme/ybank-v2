-- Credit cards are edited by what is left, not by what is owed.
--
-- People think of a card as "how much do I have left" (the 185 typed into "Balance actual"
-- on a card with a 200 limit and 15 of debt was the available amount, not the debt). The
-- card form now asks for the limit and the available balance; the debt is derived here so
-- every client (web, mobile) applies the same rule:
--   current_balance = available - credit_limit      (e.g. 185 - 200 = -15)
-- The change itself is recorded by set_account_balance() as an "Ajuste de saldo".

CREATE FUNCTION public.set_account_available(p_account_id uuid, p_available numeric)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_type public.account_type;
  v_limit numeric;
BEGIN
  SELECT a.type, a.credit_limit INTO v_type, v_limit FROM public.accounts a WHERE a.id = p_account_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_type <> 'credit_card' THEN
    RAISE EXCEPTION 'Only credit cards have an available balance' USING ERRCODE = 'check_violation';
  END IF;
  IF v_limit IS NULL OR v_limit <= 0 THEN
    RAISE EXCEPTION 'Set the credit limit first' USING ERRCODE = 'check_violation';
  END IF;
  IF p_available IS NULL THEN
    RAISE EXCEPTION 'Available balance is required' USING ERRCODE = 'check_violation';
  END IF;

  RETURN public.set_account_balance(p_account_id, p_available - v_limit);
END $$;

REVOKE ALL ON FUNCTION public.set_account_available(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_account_available(uuid, numeric) TO authenticated;
