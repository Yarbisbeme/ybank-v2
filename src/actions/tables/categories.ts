'use server'

import { createClient } from "@/lib/supabase/Server";

export async function getCategories() {
    
  const supabase = await createClient();

  // 1. Obtener el usuario actual para filtrar
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, data: [] };

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    // LA MAGIA: Trae las mías (user_id = mi_id) O las del sistema (user_id es nulo)
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error };
  }

  return { success: true, data };
}