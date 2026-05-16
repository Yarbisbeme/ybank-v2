'use server'

import { Tag } from '@/types'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'

// =========================================================
// 1. GET TAGS
// =========================================================
export async function getTags() {
  const supabase = await createSupabaseClient()
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
  })
  .select('*') 
  .single() 

  if (error) return { success: false, error: error.message }
  
  return { success: true, data: JSON.parse(JSON.stringify(data)) }
}

// =========================================================
// 3. UPDATE TAG 
// =========================================================
export async function updateTag(id: string, newName: string) {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('tags')
    .update({ name: newName.trim() })
    .eq('id', id)
    .select('*') // 💡 FIX: Pedimos que nos devuelva la etiqueta actualizada
    .single()

  if (error) return { success: false, error: error.message }

  return { success: true, data: JSON.parse(JSON.stringify(data)) }
}

// =========================================================
// 4. DELETE TAG
// =========================================================
export async function deleteTag(id: string) {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
    .select('id') // 💡 Opcional: Devolver el ID borrado es buena práctica
    .single()
  
  if (error) return { success: false, error: error.message }
  
  return { success: true, data }
}