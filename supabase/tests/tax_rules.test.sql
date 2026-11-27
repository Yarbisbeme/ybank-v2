-- Tests for Phase 2.2 (DGII tax as versioned rules). Run against a LOCAL database only:
--   docker exec -i supabase_db_ybank-v2 psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/tax_rules.test.sql
-- Everything runs inside a transaction that is rolled back.

BEGIN;

CREATE FUNCTION pg_temp.eq(actual anyelement, expected anyelement, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'FAIL %: expected %, got %', label, expected, actual; END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

CREATE FUNCTION pg_temp.balance(acc uuid) RETURNS numeric LANGUAGE sql AS
  $$ SELECT current_balance FROM public.accounts WHERE id = acc $$;

-- Inserts a transfer as the signed-in user and returns its id.
CREATE FUNCTION pg_temp.tx(p_type text, p_from uuid, p_to uuid, p_amount numeric, p_date date,
                           p_desc text DEFAULT 'x', p_target numeric DEFAULT NULL, p_rate numeric DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.transactions (user_id, account_id, transfer_to_account_id, type, amount, target_amount, exchange_rate, description, date)
  VALUES ('00000000-0000-0000-0000-0000000000a1', p_from, p_to, p_type::public.transaction_type, p_amount, coalesce(p_target, p_amount), p_rate, p_desc, p_date)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE FUNCTION pg_temp.items(p_tx uuid) RETURNS text LANGUAGE sql AS $$
  SELECT string_agg(name || '=' || unit_price || CASE WHEN tax_rule_id IS NULL THEN '' ELSE '*' END, ' + ' ORDER BY tax_rule_id NULLS FIRST)
  FROM public.transaction_items WHERE transaction_id = p_tx
$$;

-- ---------------------------------------------------------------- fixtures (as postgres)
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000a1', 'a@test.local');
INSERT INTO public.accounts (id, user_id, name, type, currency, current_balance) VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Checking', 'checking', 'DOP', 100000),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'Savings', 'savings', 'DOP', 0),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', 'Card', 'credit_card', 'DOP', -5000),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1', 'Dollars', 'savings', 'USD', 1000);

-- ---------------------------------------------------------------- rules as data
SELECT pg_temp.eq((SELECT rate FROM public.transfer_tax_rule('2026-07-02', 'third_party')), 0.0015::numeric, 'rate on 2026-07-02 is 0.15 %');
SELECT pg_temp.eq((SELECT rate FROM public.transfer_tax_rule('2026-07-03', 'third_party')), 0.0020::numeric, 'rate from 2026-07-03 is 0.20 %');
SELECT pg_temp.eq((SELECT rate FROM public.transfer_tax_rule('2001-01-01', 'third_party')), 0.0015::numeric, 'old operations use 0.15 %');
SELECT pg_temp.eq((SELECT count(*) FROM public.transfer_tax_rule('2026-11-27', 'own_accounts')), 0::bigint, 'own_accounts is exempt');
SELECT pg_temp.eq((SELECT count(*) FROM public.transfer_tax_rule('2026-11-27', 'external_wallet')), 0::bigint, 'external_wallet is exempt');

DO $$
BEGIN
  INSERT INTO public.tax_rules (code, rate, effective_from, legal_ref) VALUES ('DO_CHEQUES_TRANSFERS', 0.003, '2026-12-01', 'overlap');
  RAISE EXCEPTION 'FAIL overlapping rule was accepted';
EXCEPTION WHEN exclusion_violation THEN RAISE NOTICE 'ok  overlapping rules for the same tax are rejected';
END $$;

-- ---------------------------------------------------------------- as the signed-in user (RLS)
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

SELECT pg_temp.eq((SELECT count(*) FROM public.tax_rules), 2::bigint, 'users can read the rules');
DO $$
BEGIN
  INSERT INTO public.tax_rules (code, rate, effective_from, legal_ref) VALUES ('X', 0.5, '2030-01-01', 'x');
  RAISE EXCEPTION 'FAIL a user could insert a tax rule';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  users cannot change the rules';
END $$;

-- Own accounts: exempt (the 2.2 bug).
DO $$
DECLARE v uuid := pg_temp.tx('transfer', 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 1000, '2026-11-27');
BEGIN
  PERFORM pg_temp.eq((SELECT transfer_kind FROM public.transactions WHERE id = v), 'own_accounts', 'own transfer classified');
  PERFORM pg_temp.eq(pg_temp.balance('c0000000-0000-0000-0000-000000000001'), 99000::numeric, 'own transfer: source pays exactly the amount');
  PERFORM pg_temp.eq(pg_temp.balance('c0000000-0000-0000-0000-000000000002'), 1000::numeric, 'own transfer: destination gets the amount');
  PERFORM pg_temp.eq(pg_temp.items(v), 'Monto Transferido=1000', 'own transfer: no DGII item');
END $$;

-- Third party after the change: 0.20 %.
DO $$
DECLARE v uuid := pg_temp.tx('transfer', 'c0000000-0000-0000-0000-000000000001', NULL, 1000, '2026-11-27');
BEGIN
  PERFORM pg_temp.eq((SELECT transfer_kind FROM public.transactions WHERE id = v), 'third_party', 'third-party transfer classified');
  PERFORM pg_temp.eq((SELECT amount FROM public.transactions WHERE id = v), 1002.00::numeric, 'third party 2026-11-27: 0.20 % charged');
  PERFORM pg_temp.eq(pg_temp.balance('c0000000-0000-0000-0000-000000000001'), 97998.00::numeric, 'third party: source pays amount + tax');
  PERFORM pg_temp.eq(pg_temp.items(v), 'Monto Transferido=1000 + Comisión DGII (0.20%)=2.00*', 'third party: DGII item names the rate and links the rule');
  PERFORM pg_temp.eq((SELECT c.name FROM public.transaction_items i JOIN public.categories c ON c.id = i.category_id
                      WHERE i.transaction_id = v AND i.tax_rule_id IS NOT NULL), 'Impuestos / DGII', 'DGII item gets the system category under RLS');
END $$;

-- Third party before the change: 0.15 % (the date of the operation decides).
DO $$
DECLARE v uuid := pg_temp.tx('transfer', 'c0000000-0000-0000-0000-000000000001', NULL, 1000, '2026-07-02');
BEGIN
  PERFORM pg_temp.eq((SELECT amount FROM public.transactions WHERE id = v), 1001.50::numeric, 'third party 2026-07-02: 0.15 % charged');
  PERFORM pg_temp.eq(pg_temp.items(v), 'Monto Transferido=1000 + Comisión DGII (0.15%)=1.50*', 'old date: item says 0.15 %');
END $$;

-- Rounding to cents: 1234.57 * 0.002 = 2.46914 -> 2.47.
DO $$
DECLARE v uuid := pg_temp.tx('transfer', 'c0000000-0000-0000-0000-000000000001', NULL, 1234.57, '2026-11-27');
BEGIN
  PERFORM pg_temp.eq((SELECT amount FROM public.transactions WHERE id = v), 1237.04::numeric, 'tax is rounded to whole cents');
END $$;

-- Paying the user's own credit card is taxed, whether sent as 'transfer' or 'payment'.
DO $$
DECLARE
  v1 uuid := pg_temp.tx('transfer', 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 1000, '2026-11-27');
  v2 uuid := pg_temp.tx('payment',  'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 500, '2026-11-27');
BEGIN
  PERFORM pg_temp.eq((SELECT transfer_kind FROM public.transactions WHERE id = v1), 'own_credit_card_payment', 'transfer to own card classified as card payment');
  PERFORM pg_temp.eq((SELECT amount FROM public.transactions WHERE id = v1), 1002.00::numeric, 'own card payment (transfer): taxed');
  PERFORM pg_temp.eq((SELECT amount FROM public.transactions WHERE id = v2), 501.00::numeric, 'own card payment (payment): taxed');
  PERFORM pg_temp.eq(pg_temp.balance('c0000000-0000-0000-0000-000000000003'), -3500::numeric, 'card receives the pre-tax amounts');
END $$;

-- Cross currency to an own card: tax in the source currency, card gets the converted amount.
DO $$
DECLARE v uuid := pg_temp.tx('transfer', 'c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 100, '2026-11-27', 'x', 6050, 60.50);
BEGIN
  PERFORM pg_temp.eq(pg_temp.balance('c0000000-0000-0000-0000-000000000004'), 899.80::numeric, 'cross-ccy taxed: USD source pays 100 + 0.20 %');
  PERFORM pg_temp.eq(pg_temp.balance('c0000000-0000-0000-0000-000000000003'), 2550::numeric, 'cross-ccy taxed: card gets 6050 DOP');
  PERFORM pg_temp.eq(pg_temp.items(v), 'Monto Transferido=100.00 + Comisión DGII (0.20%)=0.20*', 'cross-ccy taxed: items in source currency');
END $$;

-- PayPal stays exempt.
DO $$
DECLARE v uuid := pg_temp.tx('transfer', 'c0000000-0000-0000-0000-000000000001', NULL, 300, '2026-11-27', 'Recarga PayPal');
BEGIN
  PERFORM pg_temp.eq((SELECT transfer_kind FROM public.transactions WHERE id = v), 'external_wallet', 'PayPal classified as external wallet');
  PERFORM pg_temp.eq((SELECT amount FROM public.transactions WHERE id = v), 300::numeric, 'PayPal: no tax');
END $$;

-- Deleting a taxed transfer restores both balances.
DO $$
DECLARE
  before_src numeric := pg_temp.balance('c0000000-0000-0000-0000-000000000001');
  before_card numeric := pg_temp.balance('c0000000-0000-0000-0000-000000000003');
  v uuid := pg_temp.tx('transfer', 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 2000, '2026-11-27');
BEGIN
  DELETE FROM public.transactions WHERE id = v;
  PERFORM pg_temp.eq(pg_temp.balance('c0000000-0000-0000-0000-000000000001'), before_src, 'delete taxed transfer: source restored');
  PERFORM pg_temp.eq(pg_temp.balance('c0000000-0000-0000-0000-000000000003'), before_card, 'delete taxed transfer: card restored');
END $$;

-- Non-transfers are not classified.
INSERT INTO public.transactions (id, user_id, account_id, type, amount, description, date)
VALUES ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-000000000001', 'expense', 10, 'x', '2026-11-27');
SELECT pg_temp.eq((SELECT transfer_kind FROM public.transactions WHERE id = 'd0000000-0000-0000-0000-000000000001'), NULL::text, 'expenses have no transfer_kind');

RESET ROLE;
ROLLBACK;
