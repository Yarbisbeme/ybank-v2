'use server'

import { revalidatePath } from 'next/cache'
import { Account, CreateAccountInput, UpdateAccountInput } from '@/types'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'

// =========================================================
// 1. GET ALL - Con Metadatos de Diseño
// =========================================================
export async function getAccounts() {
  const supabase = await createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        institution:institutions (
          id, 
          name, 
          logo_url, 
          brand_color_primary,
          brand_color_secondary,
          card_pattern,
          text_theme,
          exchange_rate_adjustment
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error al traer cuentas:', error)
      return []
    }

    // Retornamos los datos. El alias 'institution' asegura que 
    // acc.institution contenga el objeto del banco.
    return data as unknown as Account[]
  } catch (error) {
    console.error('Error inesperado:', error)
    return []
  }
}

// =========================================================
// 2. GET BY ID - Con Metadatos de Diseño
// =========================================================
export async function getAccountById(id: string) {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('accounts')
    .select(`
      *, 
      institution:institutions (
        id, name, logo_url, brand_color_primary, 
        card_pattern, text_theme, exchange_rate_adjustment
      )
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as Account
}

// =========================================================
// 3. CREATE - Crear nueva cuenta
// =========================================================
export async function createAccount(input: CreateAccountInput) {
  const supabase = await createSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuario no autenticado' }

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: input.name,
    institution_id: input.institution_id,
    type: input.type,
    currency: input.currency,
    initial_balance: input.initial_balance,
    current_balance: input.initial_balance,
    last_4_digits: input.last_4_digits || null,
    credit_limit: input.credit_limit || null,
    is_active: true
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// =========================================================
// 4. UPDATE - Incluye personalización (Color, Pattern, Theme)
// =========================================================
export async function updateAccount(accountId: string, input: UpdateAccountInput) {
  const supabase = await createSupabaseClient()

  const { error } = await supabase
    .from('accounts')
    .update({
        ...input,
        updated_at: new Date().toISOString()
    })
    .eq('id', accountId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/accounts')
  return { success: true }
}

// =========================================================
// 5. ARCHIVE - Soft Delete
// =========================================================
export async function archiveAccount(accountId: string) {
  const supabase = await createSupabaseClient()

  try {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', accountId)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =========================================================
// 6. GET INSTITUTIONS - Con colores para el selector
// =========================================================
export async function getInstitutions() {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('institutions')
    .select('id, name, logo_url, brand_color_primary')
    .order('name')

  if (error) return []
  return data
}