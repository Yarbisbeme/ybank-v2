-- Second card colour for gradient cards (UI redesign, feature/ui-ux-refactor uses a
-- `secondaryColor`). Named after `color` and institutions.brand_color_secondary.
-- NULL = the UI derives it (e.g. from the institution's brand_color_secondary).
--
-- Both colours are constrained to #RRGGBB, the format the app already validates with Zod.
-- Verified on production (2026-11-27): 36 of 37 accounts have a valid hex colour, 1 is NULL.

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS color_secondary text;

COMMENT ON COLUMN public.accounts.color_secondary IS 'Second card colour (HEX #RRGGBB) for gradients; NULL = derived by the UI';

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_color_hex CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT accounts_color_secondary_hex CHECK (color_secondary IS NULL OR color_secondary ~ '^#[0-9A-Fa-f]{6}$');
