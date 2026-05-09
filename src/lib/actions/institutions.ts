

import { createSupabaseClient } from "../supabase/createServerClient"

// =========================================================
// 1. GET INSTITUTIONS - Con colores para el selector
// =========================================================
export async function getInstitutions() {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .order('name')

  if (error) return []
  return JSON.parse(JSON.stringify(data))
}