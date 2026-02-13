'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Category } from '@/types'

// =========================================================
// 1. GET CATEGORIES (El Árbol 🌳)
// =========================================================
export async function getCategories() {
  const supabase = await createSupabaseClient()

  // Traemos TODO (Tus categorías + Las del sistema)
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  const allCategories = data as Category[]
  
  // ALGORITMO DE ÁRBOL:
  // 1. Encontramos los Padres (los que no tienen parent_id)
  const parents = allCategories.filter(c => !c.parent_id)
  
  // 2. A cada Padre, le buscamos sus Hijos
  const tree = parents.map(parent => ({
    ...parent,
    // Buscamos en el array original quienes dicen ser hijos de este padre
    subcategories: allCategories.filter(child => child.parent_id === parent.id)
  }))

  return tree
}

// =========================================================
// 2. CREATE CATEGORY (Padres e Hijos)
// =========================================================
export async function createCategory(
  name: string, 
  type: 'income' | 'expense', 
  parentId?: string, 
  icon?: string,
  color?: string
) {
  const supabase = await createSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuario no autenticado' }

  const { error } = await supabase.from('categories').insert({
    user_id: user.id, // Se marca como TUYA
    name,
    type,
    parent_id: parentId || null, // Si tiene ID, es subcategoría
    icon: icon || 'mdi-tag',
    color: color || '#64748b' // Slate-500 por defecto
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// =========================================================
// 3. DELETE CATEGORY (Limpieza)
// =========================================================
export async function deleteCategory(id: string) {
  const supabase = await createSupabaseClient()

  // OJO: Si borras un padre, Postgres podría borrar los hijos (CASCADE)
  // o dar error si hay transacciones (RESTRICT). 
  // Por ahora asumimos que RLS te deja borrar si es tuya.
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}