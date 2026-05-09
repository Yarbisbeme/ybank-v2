'use server'

import { revalidatePath } from 'next/cache'
import { Tag } from '@/types'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'

// =========================================================
// 1. GET TAGS
// =========================================================
export async function getTags() {
  const supabase = await createSupabaseClient()

  // 💡 Solo traemos los tags del usuario actual (Supabase RLS lo maneja en el fondo, pero es bueno recordarlo)
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }
  return JSON.parse(JSON.stringify(data)) as Tag[]
}

// =========================================================
// 2. CREATE TAG 
// =========================================================
export async function createTag(name: string) {
  const supabase = await createSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Autenticación requerida' }

  const { data, error } = await supabase.from('tags').insert({
    user_id: user.id,
    name: name.trim() 
  }).select().single() // 💡 LA MAGIA: Le pedimos a Supabase que nos devuelva la fila recién creada

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard')
  
  // 💡 Devolvemos el tag completo (con su ID real)
  return { success: true, tag: JSON.parse(JSON.stringify(data)) }
}
// =========================================================
// 3. UPDATE TAG (¡Agregado para correcciones de ortografía!)
// =========================================================
export async function updateTag(id: string, newName: string) {
  const supabase = await createSupabaseClient()

  const { error } = await supabase
    .from('tags')
    .update({ name: newName.trim() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// =========================================================
// 4. DELETE TAG
// =========================================================
export async function deleteTag(id: string) {
  const supabase = await createSupabaseClient()

  const { error } = await supabase.from('tags').delete().eq('id', id)
  
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard')
  return { success: true }
}