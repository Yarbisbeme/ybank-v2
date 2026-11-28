-- Tests for Phase 2.3a (balance adjustments). Run against a LOCAL database only:
--   docker exec -i supabase_db_ybank-v2 psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/balance_adjustment.test.sql
-- Everything runs inside a transaction that is rolled back.

BEGIN;

CREATE FUNCTION pg_temp.eq(actual anyelement, expected anyelement, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'FAIL %: expected %, got %', label, expected, actual; END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

CREATE FUNCTION pg_temp.balance(acc uuid) RETURNS numeric LANGUAGE sql AS
  $$ SELECT current_balance FROM public.accounts WHERE id = acc $$;

-- initial + movements (transfers in both directions), the way recalculation will read it.
CREATE FUNCTION pg_temp.from_history(acc uuid) RETURNS numeric LANGUAGE sql AS $$
  SELECT a.initial_balance
       + coalesce((SELECT sum(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)
                   FROM public.transactions t WHERE t.account_id = acc), 0)
       + coalesce((SELECT sum(t.target_amount) FROM public.transactions t WHERE t.transfer_to_account_id = acc), 0)
  FROM public.accounts a WHERE a.id = acc
$$;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');
INSERT INTO public.accounts (id, user_id, name, type, currency, initial_balance, current_balance) VALUES
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Checking', 'checking', 'DOP', 1000, 1000),
  ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'Card', 'credit_card', 'USD', -15, -15),
  ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000b2', 'B', 'checking', 'DOP', 500, 500);
INSERT INTO public.transactions (user_id, account_id, type, amount, description, date) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000001', 'expense', 200, 'groceries', '2026-11-20');

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

-- The reported bug: editing the balance directly is no longer possible.
DO $$
BEGIN
  UPDATE public.accounts SET current_balance = 5000 WHERE id = 'e0000000-0000-0000-0000-000000000001';
  RAISE EXCEPTION 'FAIL direct update of current_balance was accepted';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  users cannot write current_balance directly';
END $$;
DO $$
BEGIN
  UPDATE public.accounts SET initial_balance = -185 WHERE id = 'e0000000-0000-0000-0000-000000000002';
  RAISE EXCEPTION 'FAIL direct update of initial_balance was accepted';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  users cannot write initial_balance directly';
END $$;
UPDATE public.accounts SET name = 'Checking renamed' WHERE id = 'e0000000-0000-0000-0000-000000000001';
SELECT pg_temp.eq((SELECT name FROM public.accounts WHERE id = 'e0000000-0000-0000-0000-000000000001'), 'Checking renamed', 'other account fields are still editable');

-- Movements still move balances (the triggers run one level deeper than the guard).
INSERT INTO public.transactions (user_id, account_id, type, amount, description, date) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000001', 'expense', 50, 'coffee', '2026-11-27');
SELECT pg_temp.eq(pg_temp.balance('e0000000-0000-0000-0000-000000000001'), 750::numeric, 'movements still update the balance');

-- Lower a balance (account with movements): 750 -> 700.
DO $$
DECLARE v uuid := public.set_account_balance('e0000000-0000-0000-0000-000000000001', 700);
BEGIN
  PERFORM pg_temp.eq(pg_temp.balance('e0000000-0000-0000-0000-000000000001'), 700::numeric, 'adjust down: balance is the target');
  PERFORM pg_temp.eq((SELECT type::text || ' ' || amount || ' ' || description || ' ' || is_balance_adjustment FROM public.transactions WHERE id = v),
                     'expense 50 Ajuste de saldo true', 'adjust down: expense for the difference, flagged');
  PERFORM pg_temp.eq((SELECT date FROM public.transactions WHERE id = v), (now() AT TIME ZONE 'America/Santo_Domingo')::date, 'adjustment dated today (RD)');
  PERFORM pg_temp.eq(pg_temp.from_history('e0000000-0000-0000-0000-000000000001'), 700::numeric, 'adjust down: history still adds up');
  PERFORM pg_temp.eq((SELECT initial_balance FROM public.accounts WHERE id = 'e0000000-0000-0000-0000-000000000001'), 1000::numeric, 'initial balance untouched');
END $$;

-- Raise a balance: 700 -> 1200.
DO $$
DECLARE v uuid := public.set_account_balance('e0000000-0000-0000-0000-000000000001', 1200);
BEGIN
  PERFORM pg_temp.eq((SELECT type::text || ' ' || amount FROM public.transactions WHERE id = v), 'income 500', 'adjust up: income for the difference');
  PERFORM pg_temp.eq(pg_temp.from_history('e0000000-0000-0000-0000-000000000001'), 1200::numeric, 'adjust up: history still adds up');
END $$;

-- The reported case: a credit card at -15 set to -185 (more debt).
DO $$
DECLARE v uuid := public.set_account_balance('e0000000-0000-0000-0000-000000000002', -185);
BEGIN
  PERFORM pg_temp.eq(pg_temp.balance('e0000000-0000-0000-0000-000000000002'), -185::numeric, 'card: balance becomes -185');
  PERFORM pg_temp.eq((SELECT type::text || ' ' || amount FROM public.transactions WHERE id = v), 'expense 170', 'card: more debt is an expense of 170');
  PERFORM pg_temp.eq(pg_temp.from_history('e0000000-0000-0000-0000-000000000002'), -185::numeric, 'card: history adds up');
END $$;

-- Same balance: nothing recorded.
SELECT pg_temp.eq(public.set_account_balance('e0000000-0000-0000-0000-000000000001', 1200), NULL::uuid, 'no change -> no adjustment');
SELECT pg_temp.eq((SELECT count(*) FROM public.transactions WHERE is_balance_adjustment), 3::bigint, 'exactly three adjustments recorded');

-- Someone else's account: invisible under RLS.
DO $$
BEGIN
  PERFORM public.set_account_balance('e0000000-0000-0000-0000-000000000003', 0);
  RAISE EXCEPTION 'FAIL adjusted another user''s account';
EXCEPTION WHEN no_data_found THEN RAISE NOTICE 'ok  cannot adjust another user''s account';
END $$;

-- Deleting an adjustment undoes it (it is an ordinary movement for the balance triggers).
DELETE FROM public.transactions WHERE account_id = 'e0000000-0000-0000-0000-000000000002' AND is_balance_adjustment;
SELECT pg_temp.eq(pg_temp.balance('e0000000-0000-0000-0000-000000000002'), -15::numeric, 'deleting the adjustment restores the balance');

RESET ROLE;

-- Anonymous callers cannot run it at all.
SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM public.set_account_balance('e0000000-0000-0000-0000-000000000001', 0);
  RAISE EXCEPTION 'FAIL anon could call set_account_balance';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  anon cannot call set_account_balance';
END $$;
RESET ROLE;

ROLLBACK;
