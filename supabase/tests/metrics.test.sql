-- Tests for Phase 2.3b (metrics in Postgres). Run against a LOCAL database only:
--   docker exec -i supabase_db_ybank-v2 psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/metrics.test.sql
-- Everything runs inside a transaction that is rolled back. Dates are fixed (November 2026).

BEGIN;

CREATE FUNCTION pg_temp.eq(actual anyelement, expected anyelement, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'FAIL %: expected %, got %', label, expected, actual; END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');
INSERT INTO public.accounts (id, user_id, name, type, currency, initial_balance, current_balance) VALUES
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Main', 'checking', 'DOP', 100000, 100000),
  ('f0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'Savings', 'savings', 'DOP', 0, 0),
  ('f0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', 'Dollars', 'savings', 'USD', 1000, 1000),
  ('f0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-0000000000b2', 'B', 'checking', 'DOP', 5000, 5000);

-- A category of A's, and the system "Supermercado" (seed).
INSERT INTO public.categories (id, user_id, name, type) VALUES
  ('f5000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Gym', 'expense');

-- 12 expenses of 100 in November on Main (more than one table page), 3 of them uncategorized.
INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, date)
SELECT '00000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-000000000001',
       CASE WHEN g <= 9 THEN 'f5000000-0000-0000-0000-000000000001'::uuid END,
       'expense', 100, 'gasto ' || g, ('2026-11-01'::date + g)
FROM generate_series(1, 12) g;

INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, date) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-000000000001', NULL, 'income', 30000, 'Quincena', '2026-11-15'),
  ('00000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-000000000001', 'f5000000-0000-0000-0000-000000000001', 'expense', 700, 'octubre', '2026-10-20'),
  ('00000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-000000000003', 'f5000000-0000-0000-0000-000000000001', 'expense', 10, 'usd gym', '2026-11-03'),
  ('00000000-0000-0000-0000-0000000000b2', 'f0000000-0000-0000-0000-000000000009', NULL, 'expense', 999, 'B secret', '2026-11-03');

-- Own transfer Main -> Savings (exempt), third-party transfer from Main (taxed 0.20 %).
INSERT INTO public.transactions (user_id, account_id, transfer_to_account_id, type, amount, target_amount, description, date) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'transfer', 2000, 2000, 'ahorro', '2026-11-20'),
  ('00000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-000000000001', NULL, 'transfer', 1000, 1000, 'pago a Juan', '2026-11-21');

-- A balance adjustment (must not count anywhere except "last movement").
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

-- ---------------------------------------------------------------- account metrics
CREATE TEMP TABLE m AS SELECT * FROM public.account_month_metrics('f0000000-0000-0000-0000-000000000001', '2026-11-27');
SELECT pg_temp.eq((SELECT month_start FROM m), '2026-11-01'::date, 'month is the calendar month of p_month');
SELECT pg_temp.eq((SELECT month_spend FROM m), 1200::numeric, 'Main: spend counts all 12 expenses (not just a page of 10)');
SELECT pg_temp.eq((SELECT month_count FROM m), 12, 'Main: 12 expenses');
SELECT pg_temp.eq((SELECT month_income FROM m), 30000::numeric, 'Main: income');
SELECT pg_temp.eq((SELECT month_inflow FROM m), 30000::numeric, 'Main: inflow = income (nothing received)');
SELECT pg_temp.eq((SELECT month_outflow FROM m), 1200 + 2000 + 1002.00, 'Main: outflow = expenses + own transfer + third party incl. tax');
SELECT pg_temp.eq((SELECT prev_month_spend FROM m), 700::numeric, 'Main: previous month spend');
SELECT pg_temp.eq((SELECT uncategorized_count FROM m), 4, 'Main: 3 expenses + 1 income without category; transfers never count');
SELECT pg_temp.eq((SELECT t.description FROM public.transactions t WHERE t.id = (SELECT first_uncategorized_id FROM m)), 'Quincena', 'Main: first uncategorized is the most recent (income of Nov 15)');
SELECT pg_temp.eq((SELECT last_description FROM m), 'pago a Juan', 'Main: last movement (third-party transfer, Nov 21)');

CREATE TEMP TABLE s AS SELECT * FROM public.account_month_metrics('f0000000-0000-0000-0000-000000000002', '2026-11-27');
SELECT pg_temp.eq((SELECT month_inflow FROM s), 2000::numeric, 'Savings: incoming own transfer counts as inflow');
SELECT pg_temp.eq((SELECT month_spend FROM s), 0::numeric, 'Savings: receiving is not spending');
SELECT pg_temp.eq((SELECT last_description FROM s), 'ahorro', 'Savings: last movement includes incoming transfers');

-- Adjustment (dated today): lowers the balance, so it is an expense-type movement, yet it must
-- not change any metric. Compared before/after for the current month, whatever today is.
DO $$
DECLARE
  before_m record; after_m record; before_d numeric; after_d numeric;
BEGIN
  SELECT * INTO before_m FROM public.account_month_metrics('f0000000-0000-0000-0000-000000000001');
  SELECT coalesce(sum(total), 0) INTO before_d FROM public.spending_by_day(public.today_rd(), public.today_rd());
  PERFORM public.set_account_balance('f0000000-0000-0000-0000-000000000001',
    (SELECT current_balance - 5098 FROM public.accounts WHERE id = 'f0000000-0000-0000-0000-000000000001'));
  SELECT * INTO after_m FROM public.account_month_metrics('f0000000-0000-0000-0000-000000000001');
  SELECT coalesce(sum(total), 0) INTO after_d FROM public.spending_by_day(public.today_rd(), public.today_rd());
  PERFORM pg_temp.eq(after_m.month_spend, before_m.month_spend, 'adjustment is not spending');
  PERFORM pg_temp.eq(after_m.month_outflow, before_m.month_outflow, 'adjustment is not outflow');
  PERFORM pg_temp.eq(after_m.uncategorized_count, before_m.uncategorized_count, 'adjustment needs no category');
  PERFORM pg_temp.eq(after_d, before_d, 'dashboard: adjustment is not spending');
  PERFORM pg_temp.eq(after_m.last_description, 'Ajuste de saldo', 'adjustment is the last movement (explains the balance)');
END $$;

-- An account without movements still returns one row of zeros; someone else's returns none.
SELECT pg_temp.eq((SELECT month_spend FROM public.account_month_metrics('f0000000-0000-0000-0000-000000000002', '2026-10-01')), 0::numeric, 'empty month -> zeros');
SELECT pg_temp.eq((SELECT count(*) FROM public.account_month_metrics('f0000000-0000-0000-0000-000000000009', '2026-11-27')), 0::bigint, 'another user''s account -> no row');

-- ---------------------------------------------------------------- dashboard
CREATE TEMP TABLE d AS SELECT * FROM public.spending_by_day('2026-10-01', '2026-11-30');
SELECT pg_temp.eq((SELECT sum(total) FROM d WHERE currency = 'DOP' AND source = 'expense' AND day >= '2026-11-01'), 1200::numeric, 'dashboard: November DOP expenses complete');
SELECT pg_temp.eq((SELECT sum(total) FROM d WHERE currency = 'DOP' AND source = 'expense' AND day < '2026-11-01'), 700::numeric, 'dashboard: October DOP expenses');
SELECT pg_temp.eq((SELECT sum(total) FROM d WHERE currency = 'USD'), 10::numeric, 'dashboard: currencies are kept apart');
SELECT pg_temp.eq((SELECT sum(total) FROM d WHERE source = 'external_transfer'), 1002.00::numeric, 'dashboard: third-party transfer reported separately (own transfers excluded)');
SELECT pg_temp.eq((SELECT sum(total) FROM d WHERE category_name = 'Gym' AND day >= '2026-11-01' AND currency = 'DOP'), 900::numeric, 'dashboard: per-category totals');
SELECT pg_temp.eq((SELECT sum(total) FROM d WHERE category_id IS NULL AND source = 'expense' AND day >= '2026-11-01'), 300::numeric, 'dashboard: uncategorized expenses grouped');
SELECT pg_temp.eq((SELECT count(*) FROM d WHERE total = 999), 0::bigint, 'dashboard: other users'' data not visible');

RESET ROLE;
SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM public.spending_by_day('2026-11-01', '2026-11-30');
  RAISE EXCEPTION 'FAIL anon could call spending_by_day';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  anon cannot call the metrics functions';
END $$;
RESET ROLE;

ROLLBACK;
