'use server'

import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { Category } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getCategories() {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error al traer categorías:', error)
        return []
    }

    return data as unknown as Category[]
}