'use server'

import { createClient } from "@/lib/supabase/Server";

export async function getInstitutions() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error al traer instituciones:', error);
    return { success: false, error };
  }

  return { success: true, data };
}