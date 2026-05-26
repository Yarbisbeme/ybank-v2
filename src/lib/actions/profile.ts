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

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (payload.full_name !== undefined) updateData.full_name = payload.full_name;
  if (payload.avatar_url !== undefined) updateData.avatar_url = payload.avatar_url;
  if (payload.currency_preference !== undefined) updateData.currency_preference = payload.currency_preference;
  if (payload.theme_preference !== undefined) updateData.theme_preference = payload.theme_preference;
  
  if (payload.primary_account_id !== undefined) {
    updateData.primary_account_id = payload.primary_account_id;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData) // Pasamos el objeto limpio
    .eq('id', user.id)
    .select('*') 
    .single()

  if (error) return { success: false, error: error.message }
  
  return { success: true, data: JSON.parse(JSON.stringify(data)) }
}