-- Baseline: snapshot of the production schema taken 2026-11-25 with `supabase db dump`.
-- Supersedes the 8 June 2026 patch migrations, whose effects are already included here.
-- Do not edit: new changes go in new migrations.




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."account_type" AS ENUM (
    'checking',
    'savings',
    'credit_card',
    'investment',
    'cash'
);


ALTER TYPE "public"."account_type" OWNER TO "postgres";


CREATE TYPE "public"."currency_code" AS ENUM (
    'DOP',
    'USD'
);


ALTER TYPE "public"."currency_code" OWNER TO "postgres";


CREATE TYPE "public"."custom_pattern" AS ENUM (
    'solid',
    'waves',
    'geometric',
    'mesh',
    'lines',
    'dots',
    'curve'
);


ALTER TYPE "public"."custom_pattern" OWNER TO "postgres";


CREATE TYPE "public"."custom_text_theme" AS ENUM (
    'light',
    'dark'
);


ALTER TYPE "public"."custom_text_theme" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'cash',
    'card',
    'transfer',
    'mobile_pay',
    'check',
    'direct_debit',
    'other'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."tax_type" AS ENUM (
    'ITBIS',
    'PROPINA',
    'NONE'
);


ALTER TYPE "public"."tax_type" OWNER TO "postgres";


CREATE TYPE "public"."transaction_status" AS ENUM (
    'pending',
    'pending_match',
    'posted',
    'completed',
    'reconciled'
);


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'income',
    'expense',
    'transfer',
    'payment'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."crear_cuenta_efectivo_inicial"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_institution_id uuid;
BEGIN
  -- 💡 PASO A: Buscamos el ID de la institución de Efectivo dinámicamente
  -- (Ajusta 'Efectivo' si en tu tabla public.institutions se llama 'Cash' o distinto)
  SELECT id INTO v_institution_id 
  FROM public.institutions 
  WHERE name = 'Efectivo' 
  LIMIT 1;

  -- Si por alguna razón la consulta falla o no existe, usamos el ID de tu JSON como respaldo de seguridad
  IF v_institution_id IS NULL THEN
    v_institution_id := '82467063-0b53-4fb1-961c-04d34c9fa535'::uuid;
  END IF;

  -- 💡 PASO B: Insertamos la cuenta con tu estructura exacta
  INSERT INTO public.accounts (
    user_id,
    institution_id,
    name,
    type,
    currency,
    initial_balance,
    current_balance,
    is_active,
    color,
    savings_goal,
    custom_pattern,
    custom_text_theme
  ) 
  VALUES (
    NEW.id,
    v_institution_id,
    'Efectivo',
    'cash',
    'DOP',           -- Moneda local
    0,               -- Saldo inicial lógico
    0,               -- Saldo actual lógico
    true,
    '#69b9bf',       -- El color turquesa de tu ejemplo
    0,
    'solid',
    'dark'
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."crear_cuenta_efectivo_inicial"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_auth_user_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$DECLARE
  v_auth_avatar text;
BEGIN
  -- Si el perfil nuevo no tiene avatar, vamos a buscar si existe en auth.users
  IF NEW.avatar_url IS NULL THEN
    
    -- Hacemos la consulta correcta a la tabla auth.users
    SELECT raw_user_meta_data->>'avatar_url'
    INTO v_auth_avatar
    FROM auth.users
    WHERE id = NEW.id;

    -- Si encontramos un avatar, lo asignamos al nuevo perfil
    IF v_auth_avatar IS NOT NULL THEN
      NEW.avatar_url := v_auth_avatar;
    END IF;
    
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."handle_auth_user_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, onboarding_completed)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_transaction_after_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$DECLARE
  v_dgii_tax numeric := 0;
  v_dgii_category_id uuid;
  v_clean_amount numeric;
BEGIN
  -- 💡 1. LIMPIEZA PREVIA EN CASO DE UPDATE
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM public.transaction_items 
    WHERE transaction_id = NEW.id 
    AND name IN ('Monto Transferido', 'Comisión DGII (0.15%)');
  END IF;

  -- 💡 2. CREACIÓN O RE-CREACIÓN
  IF (NEW.type = 'transfer' OR NEW.type = 'payment') THEN
    
    IF COALESCE(NEW.description, '') ILIKE '%PayPal%' THEN
       -- PayPal: Se registra un único ítem por el valor total neto
       INSERT INTO public.transaction_items (transaction_id, name, quantity, unit_price, category_id)
       VALUES (NEW.id, 'Monto Transferido', 1, NEW.amount, NULL);
    ELSE
       -- Otros escenarios: Desglose automático del 0.15% de la DGII
       v_clean_amount := COALESCE(NEW.target_amount, NEW.amount / 1.0015);
       v_dgii_tax := NEW.amount - v_clean_amount;

       SELECT id INTO v_dgii_category_id 
       FROM public.categories 
       WHERE name = 'Impuestos / DGII' 
       LIMIT 1;

       INSERT INTO public.transaction_items (transaction_id, name, quantity, unit_price, category_id)
       VALUES
         (NEW.id, 'Monto Transferido', 1, v_clean_amount, NULL),
         (NEW.id, 'Comisión DGII (0.15%)', 1, v_dgii_tax, v_dgii_category_id);
    END IF;

  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."handle_transaction_after_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_transaction_before_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$DECLARE
  v_dgii_tax numeric := 0;
  v_old_dest_amount numeric;
BEGIN
  -- =========================================================================
  -- ⏪ FASE 1: DESHACER EL PASADO (Solo en UPDATE o DELETE)
  -- =========================================================================
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    v_old_dest_amount := COALESCE(OLD.target_amount, OLD.amount / 1.0015);

    IF OLD.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF (OLD.type = 'transfer' OR OLD.type = 'payment') THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
      IF OLD.transfer_to_account_id IS NOT NULL THEN
        UPDATE public.accounts SET current_balance = current_balance - v_old_dest_amount WHERE id = OLD.transfer_to_account_id;
      END IF;
    END IF;
  END IF;

  -- =========================================================================
  -- 🌊 FASE 2: CÁLCULOS EN MEMORIA (Exclusión explícita de PayPal)
  -- =========================================================================
  IF (TG_OP = 'INSERT' AND NEW.type IN ('transfer', 'payment')) OR 
     (TG_OP = 'UPDATE' AND NEW.type IN ('transfer', 'payment') AND OLD.type NOT IN ('transfer', 'payment')) THEN
    
    IF COALESCE(NEW.description, '') ILIKE '%PayPal%' THEN
       -- Si la transacción es de PayPal, NO aplica el impuesto del 0.15%
       NEW.target_amount := COALESCE(NEW.target_amount, NEW.amount);
    ELSE
       -- Para cualquier otro banco (n8n) o transacción manual (Frontend), aplica el 0.15%
       v_dgii_tax := NEW.amount * 0.0015;
       NEW.target_amount := NEW.amount;
       NEW.amount := NEW.amount + v_dgii_tax;
    END IF;
    
  END IF;

  -- =========================================================================
  -- ⏩ FASE 3: APLICAR EL PRESENTE (Solo en INSERT o UPDATE)
  -- =========================================================================
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'transfer' OR NEW.type = 'payment') THEN
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      IF NEW.transfer_to_account_id IS NOT NULL THEN
        UPDATE public.accounts SET current_balance = current_balance + NEW.target_amount WHERE id = NEW.transfer_to_account_id;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;$$;


ALTER FUNCTION "public"."handle_transaction_before_changes"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "institution_id" "uuid",
    "name" "text" NOT NULL,
    "type" "public"."account_type" NOT NULL,
    "currency" "public"."currency_code" DEFAULT 'DOP'::"public"."currency_code",
    "initial_balance" numeric DEFAULT 0 NOT NULL,
    "current_balance" numeric DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_4_digits" "text",
    "expiry_date" "text",
    "credit_limit" numeric,
    "network" "text",
    "cutoff_day" integer,
    "payoff_day" integer,
    "savings_goal" numeric DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "custom_pattern" "public"."custom_pattern" DEFAULT 'solid'::"public"."custom_pattern",
    "custom_text_theme" "public"."custom_text_theme" DEFAULT 'light'::"public"."custom_text_theme",
    CONSTRAINT "accounts_cutoff_day_check" CHECK ((("cutoff_day" >= 1) AND ("cutoff_day" <= 31))),
    CONSTRAINT "accounts_payoff_day_check" CHECK ((("payoff_day" >= 1) AND ("payoff_day" <= 31)))
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."accounts"."color" IS 'Color elegido por el usuario (HEX)';



COMMENT ON COLUMN "public"."accounts"."custom_pattern" IS 'Patrón elegido por el usuario (solid, waves, etc.)';



COMMENT ON COLUMN "public"."accounts"."custom_text_theme" IS 'Preferencia de contraste del usuario (light/dark)';



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "parent_id" "uuid",
    "name" "text" NOT NULL,
    "icon" "text",
    "color" "text",
    "type" "public"."transaction_type",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "categories_type_check" CHECK (("type" = ANY (ARRAY['income'::"public"."transaction_type", 'expense'::"public"."transaction_type"])))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."institutions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "exchange_rate_adjustment" numeric DEFAULT 1.50,
    "exchange_rate_buy_adjustment" numeric DEFAULT 1.00,
    "brand_color_primary" "text",
    "brand_color_secondary" "text",
    "card_pattern" "public"."custom_pattern" DEFAULT 'solid'::"public"."custom_pattern",
    "text_theme" "public"."custom_text_theme" DEFAULT 'light'::"public"."custom_text_theme"
);


ALTER TABLE "public"."institutions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."institutions"."brand_color_primary" IS 'Color principal de la marca en HEX (ej. #002a54)';



COMMENT ON COLUMN "public"."institutions"."brand_color_secondary" IS 'Color secundario para gradientes';



COMMENT ON COLUMN "public"."institutions"."card_pattern" IS 'Patrón de fondo: solid, waves, geometric, etc.';



COMMENT ON COLUMN "public"."institutions"."text_theme" IS 'Tema del texto: light (texto blanco) o dark (texto oscuro)';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "currency_preference" "public"."currency_code" DEFAULT 'DOP'::"public"."currency_code",
    "primary_account_id" "uuid",
    "theme_preference" "public"."custom_text_theme" DEFAULT 'light'::"public"."custom_text_theme",
    "monthly_savings_goal" numeric DEFAULT 0,
    "onboarding_completed" boolean DEFAULT false,
    "bio" "text",
    "phone" numeric,
    "google_access_token" "text",
    "google_refresh_token" "text",
    "google_token_expires_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "quantity" numeric DEFAULT 1,
    "unit_price" numeric NOT NULL,
    "total_price" numeric GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "category_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tax_amount" numeric(12,2) DEFAULT 0.00,
    "tax_type" "public"."tax_type" DEFAULT 'ITBIS'::"public"."tax_type",
    "discount_amount" numeric(12,2) DEFAULT 0.00
);


ALTER TABLE "public"."transaction_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_tags" (
    "transaction_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."transaction_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "transfer_to_account_id" "uuid",
    "type" "public"."transaction_type" NOT NULL,
    "amount" numeric NOT NULL,
    "description" "text" NOT NULL,
    "date" "date" NOT NULL,
    "status" "public"."transaction_status" DEFAULT 'posted'::"public"."transaction_status",
    "exclude_from_reports" boolean DEFAULT false,
    "source_email_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "target_amount" numeric,
    "exchange_rate" numeric,
    "match_key" "text",
    "payment_method" "public"."payment_method" DEFAULT 'cash'::"public"."payment_method",
    CONSTRAINT "check_transfer_dest" CHECK (("account_id" <> "transfer_to_account_id"))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_items"
    ADD CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_tags"
    ADD CONSTRAINT "transaction_tags_pkey" PRIMARY KEY ("transaction_id", "tag_id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "unique_source_email_id" UNIQUE ("source_email_id");



CREATE INDEX "idx_accounts_user" ON "public"."accounts" USING "btree" ("user_id");



CREATE INDEX "idx_transactions_account" ON "public"."transactions" USING "btree" ("account_id");



CREATE INDEX "idx_transactions_date" ON "public"."transactions" USING "btree" ("date");



CREATE OR REPLACE TRIGGER "on_profile_created" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_auth_user_sync"();



CREATE OR REPLACE TRIGGER "trg_transactions_balance_before" BEFORE INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_transaction_before_changes"();



CREATE OR REPLACE TRIGGER "trg_transactions_items_after" AFTER INSERT ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_transaction_after_insert"();



CREATE OR REPLACE TRIGGER "trigger_crear_cuenta_defecto" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."crear_cuenta_efectivo_inicial"();



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_primary_account_id_fkey" FOREIGN KEY ("primary_account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_items"
    ADD CONSTRAINT "transaction_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transaction_items"
    ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_tags"
    ADD CONSTRAINT "transaction_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_tags"
    ADD CONSTRAINT "transaction_tags_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_transfer_to_account_id_fkey" FOREIGN KEY ("transfer_to_account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can view institutions" ON "public"."institutions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Borrar Mis Categorias" ON "public"."categories" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Dueño Cuentas" ON "public"."accounts" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Dueño Tags" ON "public"."tags" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Dueño Transacciones" ON "public"."transactions" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Editar Mis Categorias" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Manejo de Tags" ON "public"."transaction_tags" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."transactions" "t"
  WHERE (("t"."id" = "transaction_tags"."transaction_id") AND ("t"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."transactions" "t"
  WHERE (("t"."id" = "transaction_tags"."transaction_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "Modificar Mis Categorias" ON "public"."categories" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Permitir a los usuarios actualizar su propio perfil" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own transaction items" ON "public"."transaction_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."transactions"
  WHERE (("transactions"."id" = "transaction_items"."transaction_id") AND ("transactions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert items to their own transactions" ON "public"."transaction_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."transactions"
  WHERE (("transactions"."id" = "transaction_items"."transaction_id") AND ("transactions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage ONLY their own categories" ON "public"."categories" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own accounts" ON "public"."accounts" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own tags" ON "public"."tags" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own transactions" ON "public"."transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own transaction items" ON "public"."transaction_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."transactions"
  WHERE (("transactions"."id" = "transaction_items"."transaction_id") AND ("transactions"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."transactions"
  WHERE (("transactions"."id" = "transaction_items"."transaction_id") AND ("transactions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own and system categories" ON "public"."categories" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own transaction items" ON "public"."transaction_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."transactions"
  WHERE (("transactions"."id" = "transaction_items"."transaction_id") AND ("transactions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Ver Bancos" ON "public"."institutions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Ver Categorias" ON "public"."categories" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."institutions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."crear_cuenta_efectivo_inicial"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."crear_cuenta_efectivo_inicial"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_auth_user_sync"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_auth_user_sync"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_transaction_after_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_transaction_after_insert"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_transaction_before_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_transaction_before_changes"() TO "service_role";


















GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."institutions" TO "anon";
GRANT ALL ON TABLE "public"."institutions" TO "authenticated";
GRANT ALL ON TABLE "public"."institutions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_items" TO "anon";
GRANT ALL ON TABLE "public"."transaction_items" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_items" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_tags" TO "anon";
GRANT ALL ON TABLE "public"."transaction_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_tags" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

































-- ============================================================
-- Objects outside the public schema that belong to the app
-- ============================================================

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();


INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth Insert" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Auth Update" ON "storage"."objects" FOR UPDATE TO "authenticated" USING (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Permitir actualización de avatars" ON "storage"."objects" FOR UPDATE TO "authenticated" USING (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Permitir eliminar avatars" ON "storage"."objects" FOR DELETE TO "authenticated" USING (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Permitir subida de avatars" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Public Access" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));



