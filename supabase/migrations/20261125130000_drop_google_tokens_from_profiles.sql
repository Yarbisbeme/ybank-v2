-- Google OAuth tokens were stored in plain text in `profiles` and leaked to the
-- browser through `select('*')` (and from there into IndexedDB).
-- Bank emails now arrive by forwarding, so the app no longer needs them.
-- The future one-time Gmail history import gets its own table with encrypted
-- tokens readable only by the service role.

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS google_access_token,
  DROP COLUMN IF EXISTS google_refresh_token,
  DROP COLUMN IF EXISTS google_token_expires_at;
