'use server'

import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { revalidatePath } from 'next/cache'

// Definimos el tipo basado en tu esquema YBANK
export interface ProfileUpdateInput {
  full_name?: string;
  avatar_url?: string | null;
  currency_preference?: string;
  primary_account_id?: string;
  theme_preference?: string;
  monthly_savings_goal?: string | number;
  onboarding_completed?: boolean;
}

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
  return data
}

export async function updateProfile(payload: ProfileUpdateInput) {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: 'No autorizado' }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      ...payload, 
      updated_at: new Date().toISOString() // Sello de tiempo automático
    })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }
  
  // Revalidamos las rutas clave para que la UI se entere del cambio
  revalidatePath('/')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  
  return { success: true }
}