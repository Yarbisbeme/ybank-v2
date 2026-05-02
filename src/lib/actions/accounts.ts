'use server'

import { revalidatePath } from 'next/cache'
import { Account, CreateAccountInput, UpdateAccountInput } from '@/types'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { getSmartRate } from '@/services/rates'

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
    // 💡 PURIFICACIÓN:
    return JSON.parse(JSON.stringify(data)) as Account[]

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
  return JSON.parse(JSON.stringify(data)) as Account
}

// =========================================================
// 3. CREATE - Crear nueva cuenta
// =========================================================
export async function createAccount(input: CreateAccountInput) {
  const supabase = await createSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuario no autenticado' }

  const { data, error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: input.name,
    institution_id: input.institution_id,
    type: input.type,
    currency: input.currency,
    initial_balance: input.initial_balance,
    current_balance: input.initial_balance,
    last_4_digits: input.last_4_digits || null,
    credit_limit: input.credit_limit || null,
    
    // 💡 LA PIEZA FALTANTE: Agregar el día de corte
    cutoff_day: input.cutoff_day || null, 
    
    expiry_date: input.expiry_date || null,
    color: input.color || '#0f172a',
    custom_pattern: input.custom_pattern || 'geometric',
    custom_text_theme: input.custom_text_theme || 'light',
    is_active: input.is_active ?? true
  }).select('id').single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/accounts') 
  
  return { success: true, data: JSON.parse(JSON.stringify(data)) }
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
// 6. CALCULATOR - Normalizador de Capital
// =========================================================
export async function calculateNormalizedTotal(accounts: any[]) {
  let totalDOP = 0;

  for (const account of accounts) {
    // 💡 FIX 2: Cambiamos 'balance' a 'current_balance'
    const accountBalance = account.current_balance || 0; 
    
    // 💡 FIX 3: Soportar institución si viene anidada (por el GET ALL) o directa
    const institutionId = account.institution?.id || account.institution_id;

    if (account.currency === 'DOP') {
      totalDOP += accountBalance;
    } 
    else if (account.currency === 'USD') {
      // Usamos el institutionId extraído de forma segura
      const rateInfo = await getSmartRate(institutionId, 'buy');
      const conversionRate = rateInfo ? rateInfo.rate : 58.00; 
      
      totalDOP += (accountBalance * conversionRate);
    }
  }

  return totalDOP; 
}