-- Consolidate RLS policies: 23 overlapping policies (several per operation, some for role
-- `public`) become one clear set per table. Effective access is unchanged except for two
-- gaps that are closed (verified 0 existing violations on production, 2026-11-27):
--   * transaction_tags: the tag must belong to the user (before: only the transaction).
--   * transaction_items / transactions: the category must be the user's or a system one.
--
-- `(select auth.uid())` instead of `auth.uid()` lets Postgres evaluate it once per query
-- (Supabase RLS performance guidance). Policies target `authenticated`: anon never had a
-- matching row (auth.uid() is NULL), so this only makes that explicit.

-- ---------------------------------------------------------------- drop old policies
DROP POLICY IF EXISTS "Dueño Cuentas" ON public.accounts;
DROP POLICY IF EXISTS "Users can manage their own accounts" ON public.accounts;

DROP POLICY IF EXISTS "Users can manage ONLY their own categories" ON public.categories;
DROP POLICY IF EXISTS "Borrar Mis Categorias" ON public.categories;
DROP POLICY IF EXISTS "Editar Mis Categorias" ON public.categories;
DROP POLICY IF EXISTS "Users can view own and system categories" ON public.categories;
DROP POLICY IF EXISTS "Ver Categorias" ON public.categories;
DROP POLICY IF EXISTS "Modificar Mis Categorias" ON public.categories;

DROP POLICY IF EXISTS "Authenticated users can view institutions" ON public.institutions;
DROP POLICY IF EXISTS "Ver Bancos" ON public.institutions;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Permitir a los usuarios actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Dueño Tags" ON public.tags;
DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;

DROP POLICY IF EXISTS "Users can delete their own transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "Users can insert items to their own transactions" ON public.transaction_items;
DROP POLICY IF EXISTS "Users can view their own transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "Users can update their own transaction items" ON public.transaction_items;

DROP POLICY IF EXISTS "Manejo de Tags" ON public.transaction_tags;

DROP POLICY IF EXISTS "Dueño Transacciones" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;

-- ---------------------------------------------------------------- helpers
-- A category the current user may use: their own or a system one (user_id IS NULL).
CREATE OR REPLACE FUNCTION public.is_usable_category(p_category_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO ''
    AS $$
  SELECT p_category_id IS NULL OR EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = p_category_id
      AND (c.user_id IS NULL OR c.user_id = (SELECT auth.uid()))
  );
$$;

-- The current user owns the transaction.
CREATE OR REPLACE FUNCTION public.owns_transaction(p_transaction_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = p_transaction_id AND t.user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_usable_category(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_transaction(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_usable_category(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_transaction(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------- new policies
CREATE POLICY accounts_owner_all ON public.accounts
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY categories_select_own_or_system ON public.categories
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = (SELECT auth.uid()));
CREATE POLICY categories_insert_own ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY categories_update_own ON public.categories
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY categories_delete_own ON public.categories
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY institutions_select_all ON public.institutions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY tags_owner_all ON public.tags
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY transactions_owner_all ON public.transactions
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_usable_category(category_id));

CREATE POLICY transaction_items_owner_all ON public.transaction_items
  FOR ALL TO authenticated
  USING (public.owns_transaction(transaction_id))
  WITH CHECK (public.owns_transaction(transaction_id) AND public.is_usable_category(category_id));

CREATE POLICY transaction_tags_owner_all ON public.transaction_tags
  FOR ALL TO authenticated
  USING (public.owns_transaction(transaction_id))
  WITH CHECK (
    public.owns_transaction(transaction_id)
    AND EXISTS (SELECT 1 FROM public.tags g WHERE g.id = tag_id AND g.user_id = (SELECT auth.uid()))
  );
