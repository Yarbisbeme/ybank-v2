'use server'

import { Account, CreateAccountInput, UpdateAccountInput } from '@/types'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { getSmartRate } from '@/services/rates'

const ACCOUNT_SELECT_QUERY = `
  *,
  institution:institutions (
    id, name, logo_url, brand_color_primary, brand_color_secondary,
    card_pattern, text_theme, exchange_rate_adjustment
  )
`;

// =========================================================
// 1. GET ALL - Con Metadatos de Diseño
// =========================================================
export async function getAccounts() {
  const supabase = await createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('accounts')
      .select(ACCOUNT_SELECT_QUERY)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error al traer cuentas:', error)
      return []
    }
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
    .select(ACCOUNT_SELECT_QUERY)
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
    cutoff_day: input.cutoff_day || null, 
    expiry_date: input.expiry_date || null,
    color: input.color || '#0f172a',
    custom_pattern: input.custom_pattern || 'geometric',
    custom_text_theme: input.custom_text_theme || 'light',
    is_active: input.is_active ?? true
  })
  .select(ACCOUNT_SELECT_QUERY)
  .single()

  if (error) return { success: false, error: error.message }

  return { success: true, data: JSON.parse(JSON.stringify(data)) }
}

// =========================================================
// 4. UPDATE - Incluye personalización (Color, Pattern, Theme)
// =========================================================
export async function updateAccount(accountId: string, input: UpdateAccountInput) {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('accounts')
    .update({
        ...input,
        updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .select(ACCOUNT_SELECT_QUERY) // 💡 MEJORA: Devolvemos la data actualizada
    .single()

  if (error) return { success: false, error: error.message }

  return { success: true, data: JSON.parse(JSON.stringify(data)) }
}

// =========================================================
// 5. ARCHIVE - Soft Delete
// =========================================================
export async function archiveAccount(accountId: string) {
  const supabase = await createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', accountId)
      .select('id') // 💡 MEJORA: Al menos devolvemos el ID para saber qué se borró
      .single()

    if (error) throw error

    return { success: true, data }
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
    const accountBalance = account.current_balance || 0; 
    const institutionId = account.institution?.id || account.institution_id;

    if (account.currency === 'DOP') {
      totalDOP += accountBalance;
    } 
    else if (account.currency === 'USD') {
      const rateInfo = await getSmartRate(institutionId, 'buy');
      const conversionRate = rateInfo ? rateInfo.rate : 58.00; 
      
      totalDOP += (accountBalance * conversionRate);
    }
  }

  return totalDOP; 
}