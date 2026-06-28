-- ==========================================
-- MIGRACIÓN: Enums faltantes en Supabase
-- Fecha: 27/06/2026
-- Descripción: Crea 5 enums nuevos y migra columnas de text a enum
-- ==========================================

-- ==========================================
-- 1. LIMPIEZA DE DATOS SUCIOS
-- ==========================================
UPDATE institutions SET card_pattern = 'mesh' WHERE card_pattern = 'mesh\r\n';
UPDATE institutions SET card_pattern = 'mesh' WHERE card_pattern LIKE 'mesh%';
UPDATE institutions SET text_theme = TRIM(text_theme) WHERE text_theme IS NOT NULL AND text_theme != TRIM(text_theme);
UPDATE accounts SET custom_pattern = TRIM(custom_pattern) WHERE custom_pattern IS NOT NULL AND custom_pattern != TRIM(custom_pattern);
UPDATE accounts SET custom_text_theme = TRIM(custom_text_theme) WHERE custom_text_theme IS NOT NULL AND custom_text_theme != TRIM(custom_text_theme);
UPDATE accounts SET currency = TRIM(currency) WHERE currency IS NOT NULL AND currency != TRIM(currency);


-- ==========================================
-- 2. CREAR NUEVOS ENUMS
-- ==========================================

CREATE TYPE public.currency_code AS ENUM ('DOP', 'USD');
CREATE TYPE public.custom_pattern AS ENUM ('solid', 'waves', 'geometric', 'mesh', 'lines', 'dots', 'curve');
CREATE TYPE public.custom_text_theme AS ENUM ('light', 'dark');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'pending_match', 'posted', 'completed', 'reconciled');
CREATE TYPE public.tax_type AS ENUM ('ITBIS', 'PROPINA', 'NONE');


-- ==========================================
-- 3. MIGRAR TABLA accounts
-- ==========================================

ALTER TABLE public.accounts ALTER COLUMN currency DROP DEFAULT;
ALTER TABLE public.accounts ALTER COLUMN custom_pattern DROP DEFAULT;
ALTER TABLE public.accounts ALTER COLUMN custom_text_theme DROP DEFAULT;

ALTER TABLE public.accounts
  ALTER COLUMN currency TYPE public.currency_code USING currency::public.currency_code;
ALTER TABLE public.accounts
  ALTER COLUMN currency SET DEFAULT 'DOP'::public.currency_code;

ALTER TABLE public.accounts
  ALTER COLUMN custom_pattern TYPE public.custom_pattern USING custom_pattern::public.custom_pattern;
ALTER TABLE public.accounts
  ALTER COLUMN custom_pattern SET DEFAULT 'solid'::public.custom_pattern;

ALTER TABLE public.accounts
  ALTER COLUMN custom_text_theme TYPE public.custom_text_theme USING custom_text_theme::public.custom_text_theme;
ALTER TABLE public.accounts
  ALTER COLUMN custom_text_theme SET DEFAULT 'light'::public.custom_text_theme;


-- ==========================================
-- 4. MIGRAR TABLA transactions
-- ==========================================

ALTER TABLE public.transactions ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.transactions
  ALTER COLUMN status TYPE public.transaction_status USING status::public.transaction_status;
ALTER TABLE public.transactions
  ALTER COLUMN status SET DEFAULT 'posted'::public.transaction_status;


-- ==========================================
-- 5. MIGRAR TABLA transaction_items
-- ==========================================

ALTER TABLE public.transaction_items ALTER COLUMN tax_type DROP DEFAULT;

ALTER TABLE public.transaction_items
  ALTER COLUMN tax_type TYPE public.tax_type USING tax_type::public.tax_type;
ALTER TABLE public.transaction_items
  ALTER COLUMN tax_type SET DEFAULT 'ITBIS'::public.tax_type;


-- ==========================================
-- 6. MIGRAR TABLA institutions
-- ==========================================

ALTER TABLE public.institutions ALTER COLUMN card_pattern DROP DEFAULT;
ALTER TABLE public.institutions ALTER COLUMN text_theme DROP DEFAULT;

ALTER TABLE public.institutions
  ALTER COLUMN card_pattern TYPE public.custom_pattern USING card_pattern::public.custom_pattern;
ALTER TABLE public.institutions
  ALTER COLUMN card_pattern SET DEFAULT 'solid'::public.custom_pattern;

ALTER TABLE public.institutions
  ALTER COLUMN text_theme TYPE public.custom_text_theme USING text_theme::public.custom_text_theme;
ALTER TABLE public.institutions
  ALTER COLUMN text_theme SET DEFAULT 'light'::public.custom_text_theme;


-- ==========================================
-- 7. MIGRAR TABLA profiles (theme_preference)
-- ==========================================

ALTER TABLE public.profiles ALTER COLUMN theme_preference DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN theme_preference TYPE public.custom_text_theme
  USING theme_preference::public.custom_text_theme;

ALTER TABLE public.profiles
  ALTER COLUMN theme_preference SET DEFAULT 'light'::public.custom_text_theme;


-- ==========================================
-- 8. MIGRAR TABLA profiles (currency_preference)
-- ==========================================

ALTER TABLE public.profiles ALTER COLUMN currency_preference DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN currency_preference TYPE public.currency_code
  USING currency_preference::public.currency_code;

ALTER TABLE public.profiles
  ALTER COLUMN currency_preference SET DEFAULT 'DOP'::public.currency_code;


-- ==========================================
-- 9. CREAR ENUM payment_method Y MIGRAR
-- ==========================================

CREATE TYPE public.payment_method AS ENUM (
  'cash',           -- Efectivo
  'card',           -- Tarjeta de crédito/débito
  'transfer',       -- Transferencia bancaria
  'mobile_pay',     -- Pago móvil (Banca Móvil)
  'check',          -- Cheque
  'direct_debit',   -- Débito directo
  'other'           -- Otro
);

ALTER TABLE public.transactions ALTER COLUMN payment_method DROP DEFAULT;

ALTER TABLE public.transactions
  ALTER COLUMN payment_method TYPE public.payment_method
  USING payment_method::public.payment_method;

ALTER TABLE public.transactions
  ALTER COLUMN payment_method SET DEFAULT 'cash'::public.payment_method;
