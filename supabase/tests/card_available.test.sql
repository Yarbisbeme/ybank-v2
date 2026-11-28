-- Tests for set_account_available(). Run against a LOCAL database only:
--   docker exec -i supabase_db_ybank-v2 psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/card_available.test.sql
-- Everything runs inside a transaction that is rolled back.

BEGIN;

CREATE FUNCTION pg_temp.eq(actual anyelement, expected anyelement, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'FAIL %: expected %, got %', label, expected, actual; END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

CREATE FUNCTION pg_temp.balance(acc uuid) RETURNS numeric LANGUAGE sql AS
  $$ SELECT current_balance FROM public.accounts WHERE id = acc $$;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');
INSERT INTO public.accounts (id, user_id, name, type, currency, credit_limit, initial_balance, current_balance) VALUES
  ('ca000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Prueba', 'credit_card', 'USD', 200, -15, -15),
  ('ca000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'Sin limite', 'credit_card', 'DOP', NULL, -500, -500),
  ('ca000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', 'Ahorro', 'savings', 'DOP', NULL, 100, 100),
  ('ca000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-0000000000b2', 'B card', 'credit_card', 'DOP', 1000, 0, 0);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

-- The reported case: limit 200, 185 available -> debt 15. Already true: nothing recorded.
SELECT pg_temp.eq(public.set_account_available('ca000000-0000-0000-0000-000000000001', 185), NULL::uuid, 'available 185 of 200 = current debt 15 -> no adjustment');

-- Spend 50 more outside the app: available 135 -> debt 65.
DO $$
DECLARE v uuid := public.set_account_available('ca000000-0000-0000-0000-000000000001', 135);
BEGIN
  PERFORM pg_temp.eq(pg_temp.balance('ca000000-0000-0000-0000-000000000001'), -65::numeric, 'available 135 -> balance -65');
  PERFORM pg_temp.eq((SELECT type::text || ' ' || amount || ' ' || is_balance_adjustment FROM public.transactions WHERE id = v), 'expense 50 true', 'recorded as a 50 adjustment');
END $$;

-- Paid in full: available = limit -> no debt.
SELECT public.set_account_available('ca000000-0000-0000-0000-000000000001', 200) IS NOT NULL;
SELECT pg_temp.eq(pg_temp.balance('ca000000-0000-0000-0000-000000000001'), 0::numeric, 'available = limit -> balance 0');

-- Overpaid: available above the limit -> positive balance (credit in favour).
SELECT public.set_account_available('ca000000-0000-0000-0000-000000000001', 210) IS NOT NULL;
SELECT pg_temp.eq(pg_temp.balance('ca000000-0000-0000-0000-000000000001'), 10::numeric, 'available 210 of 200 -> +10 in favour');

DO $$
BEGIN
  PERFORM public.set_account_available('ca000000-0000-0000-0000-000000000002', 100);
  RAISE EXCEPTION 'FAIL card without limit accepted';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  a card without a limit asks for the limit first';
END $$;

DO $$
BEGIN
  PERFORM public.set_account_available('ca000000-0000-0000-0000-000000000003', 100);
  RAISE EXCEPTION 'FAIL savings account accepted';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  only credit cards have an available balance';
END $$;

DO $$
BEGIN
  PERFORM public.set_account_available('ca000000-0000-0000-0000-000000000009', 0);
  RAISE EXCEPTION 'FAIL adjusted another user''s card';
EXCEPTION WHEN no_data_found THEN RAISE NOTICE 'ok  cannot touch another user''s card';
END $$;

RESET ROLE;
ROLLBACK;
