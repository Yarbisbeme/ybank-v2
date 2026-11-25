-- Regression tests for B1 (cross-currency transfers) and B4 (avatar policies).
-- Run against a LOCAL database only:
--   npx supabase db start
--   docker exec -i supabase_db_ybank-v2 psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/balance_and_avatar.test.sql
-- Everything runs inside a transaction that is rolled back.

BEGIN;

CREATE FUNCTION pg_temp.assert_eq(actual numeric, expected numeric, label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL %: expected %, got %', label, expected, actual;
  END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

INSERT INTO public.institutions (name) VALUES ('Efectivo') ON CONFLICT (name) DO NOTHING;

-- Users (on_auth_user_created -> profile -> default cash account)
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');

INSERT INTO public.accounts (id, user_id, name, type, currency, current_balance) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'USD', 'savings', 'USD', 1000),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'DOP', 'checking', 'DOP', 10000),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', 'DOP2', 'savings', 'DOP', 0);

CREATE FUNCTION pg_temp.balance(acc uuid) RETURNS numeric LANGUAGE sql AS
  $$ SELECT current_balance FROM public.accounts WHERE id = acc $$;

-- 1. Same-currency transfer, as the app sends it (target_amount = amount): unchanged behaviour.
INSERT INTO public.transactions (id, user_id, account_id, transfer_to_account_id, type, amount, target_amount, description, date)
VALUES ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1',
        '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003',
        'transfer', 1000, 1000, 'same currency', '2026-11-25');
SELECT pg_temp.assert_eq(pg_temp.balance('10000000-0000-0000-0000-000000000002'), 8998.5, 'same-ccy: source pays amount + 0.15%');
SELECT pg_temp.assert_eq(pg_temp.balance('10000000-0000-0000-0000-000000000003'), 1000, 'same-ccy: destination gets amount');
SELECT pg_temp.assert_eq((SELECT sum(unit_price) FROM public.transaction_items WHERE transaction_id = '20000000-0000-0000-0000-000000000001'), 1001.5, 'same-ccy: items add up to amount');

-- 2. Cross-currency transfer: 100 USD -> 6050 DOP at 60.50 (B1).
INSERT INTO public.transactions (id, user_id, account_id, transfer_to_account_id, type, amount, target_amount, exchange_rate, description, date)
VALUES ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1',
        '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
        'transfer', 100, 6050, 60.50, 'cross currency', '2026-11-25');
SELECT pg_temp.assert_eq(pg_temp.balance('10000000-0000-0000-0000-000000000001'), 899.85, 'cross-ccy: USD source pays 100 + 0.15%');
SELECT pg_temp.assert_eq(pg_temp.balance('10000000-0000-0000-0000-000000000002'), 8998.5 + 6050, 'cross-ccy: DOP destination gets converted amount');
SELECT pg_temp.assert_eq((SELECT min(unit_price) FROM public.transaction_items WHERE transaction_id = '20000000-0000-0000-0000-000000000002'), 0.15, 'cross-ccy: tax item positive, in source currency');
SELECT pg_temp.assert_eq((SELECT sum(unit_price) FROM public.transaction_items WHERE transaction_id = '20000000-0000-0000-0000-000000000002'), 100.15, 'cross-ccy: items add up to amount');

-- 3. Deleting the cross-currency transfer restores both balances.
DELETE FROM public.transactions WHERE id = '20000000-0000-0000-0000-000000000002';
SELECT pg_temp.assert_eq(pg_temp.balance('10000000-0000-0000-0000-000000000001'), 1000, 'delete: USD restored');
SELECT pg_temp.assert_eq(pg_temp.balance('10000000-0000-0000-0000-000000000002'), 8998.5, 'delete: DOP restored');

-- 4. Cross-currency without target_amount is rejected instead of crediting the wrong amount.
DO $$
BEGIN
  INSERT INTO public.transactions (user_id, account_id, transfer_to_account_id, type, amount, exchange_rate, description, date)
  VALUES ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000001',
          '10000000-0000-0000-0000-000000000002', 'transfer', 100, 60.50, 'missing target', '2026-11-25');
  RAISE EXCEPTION 'FAIL cross-ccy without target_amount was accepted';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'ok  cross-ccy without target_amount rejected';
END $$;

-- 5. PayPal stays tax-exempt.
INSERT INTO public.transactions (user_id, account_id, transfer_to_account_id, type, amount, description, date)
VALUES ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003', 'transfer', 500, 'Pago PayPal', '2026-11-25');
SELECT pg_temp.assert_eq(pg_temp.balance('10000000-0000-0000-0000-000000000002'), 8498.5, 'paypal: no tax');

-- 6. Avatar policies (B4): user A can write only inside their own folder.
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.objects (bucket_id, name, owner) VALUES
  ('avatars', '00000000-0000-0000-0000-0000000000b2/b.png', '00000000-0000-0000-0000-0000000000b2');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

INSERT INTO storage.objects (bucket_id, name, owner)
VALUES ('avatars', '00000000-0000-0000-0000-0000000000a1/a.png', '00000000-0000-0000-0000-0000000000a1');
DO $$ BEGIN RAISE NOTICE 'ok  avatars: user can upload to own folder'; END $$;

DO $$
BEGIN
  INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES ('avatars', '00000000-0000-0000-0000-0000000000b2/evil.png', '00000000-0000-0000-0000-0000000000a1');
  RAISE EXCEPTION 'FAIL avatars: upload into another user''s folder was accepted';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'ok  avatars: upload into another user''s folder rejected';
END $$;

DO $$
DECLARE n int;
BEGIN
  UPDATE storage.objects SET name = name WHERE name = '00000000-0000-0000-0000-0000000000b2/b.png';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL avatars: updated another user''s file'; END IF;
  RAISE NOTICE 'ok  avatars: cannot update another user''s file';
END $$;

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'avatars';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL avatars: listing shows % files, expected only own (1)', n; END IF;
  RAISE NOTICE 'ok  avatars: listing shows only own files';
END $$;

RESET ROLE;
ROLLBACK;
