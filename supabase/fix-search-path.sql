-- Fix: function_search_path_mutable
-- Establece search_path = public explícitamente en funciones sin uno definido

DO $$
DECLARE
  func RECORD;
  fixed INTEGER := 0;
BEGIN
  FOR func IN
    SELECT p.proname,
           pg_get_function_identity_arguments(p.oid) AS params
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND (p.proconfig IS NULL
           OR NOT (p.proconfig @> ARRAY['search_path=public']::text[]))
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SET search_path = public;',
      func.proname, func.params
    );
    RAISE NOTICE 'Fixed: %(%s)', func.proname, func.params;
    fixed := fixed + 1;
  END LOOP;

  RAISE NOTICE 'Total funciones corregidas: %', fixed;
END $$;

-- Verificación post-fix
SELECT proname AS function_name,
       proconfig AS current_config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f';
