-- Card style options from the UI redesign (feature/ui-ux-refactor, YCard), which today are
-- only kept in form state and lost on save. Stored values are English, like the existing
-- custom_pattern enum; Spanish labels live in the UI.
--   UI base    plana / degradado / materia  ->  flat / gradient / textured
--   UI finish  mate / metal / holo          ->  matte / metal / holo
-- text + CHECK instead of new enum types: easier to extend when the design evolves.
--
-- Not stored on purpose: text colour (YCard derives contrast from the colour; the existing
-- custom_text_theme column is redundant and will be dropped once the old UI is gone).
-- Finish unlock rules (metal after 30 days, holo after a budget) are business rules to be
-- enforced server-side when budgets exist; for now the chosen value is stored as-is.

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS card_base text NOT NULL DEFAULT 'textured',
  ADD COLUMN IF NOT EXISTS card_shape_intensity smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS card_finish text NOT NULL DEFAULT 'matte';

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_card_base_valid CHECK (card_base IN ('flat', 'gradient', 'textured')),
  ADD CONSTRAINT accounts_card_shape_intensity_valid CHECK (card_shape_intensity BETWEEN 0 AND 2),
  ADD CONSTRAINT accounts_card_finish_valid CHECK (card_finish IN ('matte', 'metal', 'holo'));

COMMENT ON COLUMN public.accounts.card_base IS 'Card surface: flat | gradient (uses color_secondary) | textured';
COMMENT ON COLUMN public.accounts.card_shape_intensity IS 'Opacity level of the card pattern: 0 low, 1 medium, 2 high';
COMMENT ON COLUMN public.accounts.card_finish IS 'Card finish: matte | metal | holo';

-- network existed but was free text, unused by the app. Production values (2026-11-27):
-- 34 NULL, 'Visa', 'Visa  ' (trailing spaces), 'Mastercard'. Normalise, then constrain.
UPDATE public.accounts SET network = NULLIF(lower(btrim(network)), '') WHERE network IS NOT NULL;
UPDATE public.accounts SET network = NULL WHERE network IS NOT NULL AND network NOT IN ('visa', 'mastercard');

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_network_valid CHECK (network IS NULL OR network IN ('visa', 'mastercard'));

COMMENT ON COLUMN public.accounts.network IS 'Card network: visa | mastercard | NULL';
