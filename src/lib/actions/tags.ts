'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Tag } from '@/types'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'

// 1. GET TAGS
export async function getTags() {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) return []
  return data as Tag[]
}

// 2. CREATE TAG
export async function createTag(name: string) {
  const supabase = await createSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Auth required' }

  const { error } = await supabase.from('tags').insert({
    user_id: user.id,
    name: name.trim()
  })

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard')
  return { success: true }
}

// 3. DELETE TAG
export async function deleteTag(id: string) {
  const supabase = await createSupabaseClient()

  const { error } = await supabase.from('tags').delete().eq('id', id)
  
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard')
  return { success: true }
}