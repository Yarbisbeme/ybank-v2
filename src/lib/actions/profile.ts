'use server'

import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { ProfileUpdateInput } from '@/types'

export async function getProfile() {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('No autorizado')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return JSON.parse(JSON.stringify(data))
}

export async function updateProfile(payload: ProfileUpdateInput) {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: 'No autorizado' }

  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      ...payload, 
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select('*') 
    .single()

  if (error) return { success: false, error: error.message }
  
  return { success: true, data: JSON.parse(JSON.stringify(data)) }
}