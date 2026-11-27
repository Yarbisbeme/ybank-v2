-- Tests for PR 2.1 (schema hardening). Run against a LOCAL database only:
--   npx supabase db reset            (applies all migrations + seed)
--   docker exec -i supabase_db_ybank-v2 psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/schema_2_1.test.sql
-- Everything runs inside a transaction that is rolled back.

BEGIN;

CREATE FUNCTION pg_temp.ok(cond boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL %', label; END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

-- Expect a statement to fail with a given SQLSTATE class.
CREATE FUNCTION pg_temp.rejects(stmt text, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE stmt;
  RAISE EXCEPTION 'FAIL % (was accepted)', label;
EXCEPTION
  WHEN insufficient_privilege OR check_violation THEN RAISE NOTICE 'ok  %', label;
END $$;

-- Act as a signed-in user for the rest of the transaction (or until RESET ROLE).
CREATE FUNCTION pg_temp.as_user(uid uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
END $$;

-- ---------------------------------------------------------------- fixtures (as postgres)
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');

INSERT INTO public.accounts (id, user_id, name, type, currency, current_balance) VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'A main', 'checking', 'DOP', 1000),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'A savings', 'savings', 'DOP', 0),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b2', 'B main', 'checking', 'DOP', 500);

INSERT INTO public.tags (id, user_id, name) VALUES
  ('a7000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'A tag'),
  ('b7000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b2', 'B tag');

INSERT INTO public.categories (id, user_id, name, type) VALUES
  ('b5000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b2', 'B private category', 'expense');

INSERT INTO public.transactions (id, user_id, account_id, type, amount, description, date) VALUES
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b2', 'b0000000-0000-0000-0000-000000000001', 'expense', 50, 'B expense', '2026-11-27');

-- ---------------------------------------------------------------- rls_auto_enable
CREATE TABLE public.tmp_rls_probe (id int);
SELECT pg_temp.ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.tmp_rls_probe'::regclass), 'new public table gets RLS enabled automatically');
DROP TABLE public.tmp_rls_probe;

-- ---------------------------------------------------------------- B5 ownership (service role / postgres bypasses RLS)
SELECT pg_temp.rejects($$INSERT INTO public.transactions (user_id, account_id, type, amount, description, date)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'b0000000-0000-0000-0000-000000000001', 'expense', 1, 'x', '2026-11-27')$$,
  'B5: even the service role cannot book on another user''s account');
SELECT pg_temp.rejects($$INSERT INTO public.transactions (user_id, account_id, transfer_to_account_id, type, amount, target_amount, description, date)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'transfer', 10, 10, 'x', '2026-11-27')$$,
  'B5: cannot transfer into another user''s account');
SELECT pg_temp.ok((SELECT current_balance FROM public.accounts WHERE id = 'b0000000-0000-0000-0000-000000000001') = 450, 'rejected transfer did not touch the foreign balance (500 - B''s own 50 expense)');

-- ---------------------------------------------------------------- color constraints
SELECT pg_temp.rejects($$UPDATE public.accounts SET color_secondary = 'red' WHERE id = 'a0000000-0000-0000-0000-000000000001'$$, 'color_secondary must be #RRGGBB');
SELECT pg_temp.rejects($$UPDATE public.accounts SET color = '#12345' WHERE id = 'a0000000-0000-0000-0000-000000000001'$$, 'color must be #RRGGBB');
UPDATE public.accounts SET color = '#0F172A', color_secondary = '#38bdf8' WHERE id = 'a0000000-0000-0000-0000-000000000001';
SELECT pg_temp.ok((SELECT color_secondary FROM public.accounts WHERE id = 'a0000000-0000-0000-0000-000000000001') = '#38bdf8', 'valid secondary colour is stored');
UPDATE public.accounts SET color_secondary = NULL WHERE id = 'a0000000-0000-0000-0000-000000000001';
SELECT pg_temp.ok(true, 'NULL secondary colour is allowed');

-- ---------------------------------------------------------------- card style
SELECT pg_temp.ok((SELECT card_base = 'textured' AND card_shape_intensity = 1 AND card_finish = 'matte' AND network IS NULL
                   FROM public.accounts WHERE id = 'a0000000-0000-0000-0000-000000000002'), 'new accounts get card style defaults');
UPDATE public.accounts SET card_base = 'gradient', card_shape_intensity = 2, card_finish = 'holo', network = 'mastercard'
  WHERE id = 'a0000000-0000-0000-0000-000000000001';
SELECT pg_temp.ok(true, 'valid card style values are stored');
SELECT pg_temp.rejects($$UPDATE public.accounts SET card_base = 'degradado' WHERE id = 'a0000000-0000-0000-0000-000000000001'$$, 'card_base rejects UI (Spanish) ids');
SELECT pg_temp.rejects($$UPDATE public.accounts SET card_finish = 'mate' WHERE id = 'a0000000-0000-0000-0000-000000000001'$$, 'card_finish rejects unknown values');
SELECT pg_temp.rejects($$UPDATE public.accounts SET card_shape_intensity = 3 WHERE id = 'a0000000-0000-0000-0000-000000000001'$$, 'card_shape_intensity must be 0..2');
SELECT pg_temp.rejects($$UPDATE public.accounts SET network = 'Visa  ' WHERE id = 'a0000000-0000-0000-0000-000000000001'$$, 'network must be normalised (visa | mastercard)');

-- ---------------------------------------------------------------- user A (RLS)
SELECT pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');

SELECT pg_temp.ok((SELECT count(*) FROM public.accounts) = 3, 'A sees own accounts only (2 + default cash account)');
SELECT pg_temp.ok((SELECT count(*) FROM public.transactions) = 0, 'A cannot see B''s transactions');
SELECT pg_temp.ok((SELECT count(*) FROM public.tags) = 1, 'A sees own tags only');
SELECT pg_temp.ok((SELECT count(*) FROM public.categories WHERE user_id IS NULL) > 0, 'A sees system categories');
SELECT pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.categories WHERE id = 'b5000000-0000-0000-0000-000000000001'), 'A cannot see B''s private category');
SELECT pg_temp.ok((SELECT count(*) FROM public.institutions) > 0, 'A sees institutions');
SELECT pg_temp.ok((SELECT count(*) FROM public.profiles) = 1, 'A sees only own profile');

-- Legit write: transfer between A's own accounts (balance trigger still works under RLS).
INSERT INTO public.transactions (id, user_id, account_id, transfer_to_account_id, type, amount, target_amount, description, date)
VALUES ('aa000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1',
        'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'transfer', 100, 100, 'own transfer', '2026-11-27');
SELECT pg_temp.ok((SELECT current_balance FROM public.accounts WHERE id = 'a0000000-0000-0000-0000-000000000002') = 100, 'own transfer credited (RLS + triggers)');
SELECT pg_temp.ok((SELECT count(*) FROM public.transaction_items WHERE transaction_id = 'aa000000-0000-0000-0000-000000000001') = 1, 'automatic item still inserted under RLS (own transfer: no DGII item since 2.2; taxed case in tax_rules.test.sql)');

-- updated_at is server-maintained.
UPDATE public.transactions SET updated_at = '2000-01-01' WHERE id = 'aa000000-0000-0000-0000-000000000001';
SELECT pg_temp.ok((SELECT updated_at FROM public.transactions WHERE id = 'aa000000-0000-0000-0000-000000000001') > '2026-01-01', 'updated_at is set by the server, not the client');

-- Gaps closed.
SELECT pg_temp.rejects($$INSERT INTO public.transaction_tags (transaction_id, tag_id) VALUES ('aa000000-0000-0000-0000-000000000001', 'b7000000-0000-0000-0000-000000000001')$$,
  'A cannot attach B''s tag to own transaction');
INSERT INTO public.transaction_tags (transaction_id, tag_id) VALUES ('aa000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000001');
SELECT pg_temp.ok(true, 'A can attach own tag');
SELECT pg_temp.rejects($$INSERT INTO public.transaction_items (transaction_id, name, quantity, unit_price, category_id) VALUES ('aa000000-0000-0000-0000-000000000001', 'x', 1, 1, 'b5000000-0000-0000-0000-000000000001')$$,
  'A cannot use B''s private category in an item');
SELECT pg_temp.rejects($$INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, date) VALUES ('00000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', 'expense', 1, 'x', '2026-11-27')$$,
  'A cannot use B''s private category in a transaction');
SELECT pg_temp.rejects($$INSERT INTO public.transaction_items (transaction_id, name, quantity, unit_price) VALUES ('bb000000-0000-0000-0000-000000000001', 'x', 1, 1)$$,
  'A cannot add items to B''s transaction');
SELECT pg_temp.rejects($$INSERT INTO public.transactions (user_id, account_id, type, amount, description, date) VALUES ('00000000-0000-0000-0000-0000000000b2', 'b0000000-0000-0000-0000-000000000001', 'expense', 1, 'x', '2026-11-27')$$,
  'A cannot create a transaction as B');

RESET ROLE;

-- ---------------------------------------------------------------- anon
SET LOCAL ROLE anon;
SELECT pg_temp.ok((SELECT count(*) FROM public.accounts) = 0 AND (SELECT count(*) FROM public.institutions) = 0, 'anon sees nothing');
RESET ROLE;

ROLLBACK;
