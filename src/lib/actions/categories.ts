// @/app/actions/categories.ts (o donde tengas tus actions)
'use server'

import { Category, CategoryTree } from '@/types'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'

// =========================================================
// 1. GET CATEGORIES (El Árbol Fijo 🌳)
// =========================================================
export async function getCategories(): Promise<CategoryTree[]> {
  const supabase = await createSupabaseClient()

  // Traemos el catálogo de categorías fijas del sistema
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    // Opcional: podrías filtrar aquí por un "is_system = true" 
    // si en algún momento decides soportar ambas cosas.
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
  const tree: CategoryTree[] = parents.map(parent => ({
    ...parent,
    subcategories: allCategories.filter(child => child.parent_id === parent.id)
  }))

  return tree
}