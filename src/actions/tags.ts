'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Tag } from '@/types'

// 1. GET TAGS
export async function getTags() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) return []
  return data as Tag[]
}

// 2. CREATE TAG
export async function createTag(name: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

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
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { error } = await supabase.from('tags').delete().eq('id', id)
  
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard')
  return { success: true }
}