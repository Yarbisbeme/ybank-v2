-- Server-maintained `updated_at`.
-- Needed for incremental sync (offline plan, docs/arquitectura/01 §A.3) and auditability.
-- Before: only accounts/profiles had the column and the app wrote it with the client clock.
-- `deleted_at` (soft delete) is intentionally left for 2.3, together with the RPC that
-- defines its behaviour, to avoid a column with no semantics.

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz;
UPDATE public.transactions SET updated_at = COALESCE(created_at, now()) WHERE updated_at IS NULL;
ALTER TABLE public.transactions
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE OR REPLACE TRIGGER trg_transactions_set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_accounts_set_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
