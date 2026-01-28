'use server'

import { createClient } from "@/lib/supabase/Server";

// 1. Obtener mis tags
export async function getTags() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, data: [] };

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  return { success: !error, data: data || [], error };
}

// 2. Crear un nuevo tag (rápido, desde el formulario de transacción)
export async function createTag(tagName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autorizado" };

  const { data, error } = await supabase
    .from('tags')
    .insert({
      name: tagName,
      user_id: user.id
    })
    .select()
    .single();

  return { success: !error, data, error };
}