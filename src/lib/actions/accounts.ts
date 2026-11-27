'use server'

import { Account, Operation } from '@/types'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { getSmartRate } from '@/services/rates'
import { createAccountSchema, updateAccountSchema, getFirstError } from '@/lib/validation'

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
      console.error('Error al traer cuentas:', error);
      throw new Error(error.message); // 💡 DEBE SER THROW
    }
    return JSON.parse(JSON.stringify(data)) as Account[]

  } catch (error) {
    console.error('Error de red/Supabase:', error);
    throw error; // 💡 ESTO ES VITAL: Le dice a TanStack que la petición falló, para que conserve la caché
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
export async function createAccount(input: any) {
  const parsed = createAccountSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: getFirstError(parsed.error) }

  const valid = parsed.data
  const supabase = await createSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuario no autenticado' }

  const { data, error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: valid.name,
    institution_id: valid.institution_id,
    type: valid.type,
    currency: valid.currency,
    initial_balance: valid.initial_balance,
    current_balance: valid.initial_balance,
    last_4_digits: valid.last_4_digits || null,
    credit_limit: valid.credit_limit || null,
    cutoff_day: valid.cutoff_day || null, 
    expiry_date: valid.expiry_date || null,
    color: valid.color || '#0f172a',
    color_secondary: valid.color_secondary ?? null,
    network: valid.network ?? null,
    // Omitted when not sent so the DB defaults apply (textured / 1 / matte).
    ...(valid.card_base !== undefined && { card_base: valid.card_base }),
    ...(valid.card_shape_intensity !== undefined && { card_shape_intensity: valid.card_shape_intensity }),
    ...(valid.card_finish !== undefined && { card_finish: valid.card_finish }),
    custom_pattern: valid.custom_pattern || 'geometric',
    custom_text_theme: valid.custom_text_theme || 'light',
    is_active: valid.is_active
  })
  .select(ACCOUNT_SELECT_QUERY)
  .single()

  if (error) return { success: false, error: error.message }

  return { success: true, data: JSON.parse(JSON.stringify(data)) }
}

// =========================================================
// 4. UPDATE - Incluye personalización (Color, Pattern, Theme)
// =========================================================
export async function updateAccount(accountId: string, input: any) {
  const parsed = updateAccountSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: getFirstError(parsed.error) }

  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('accounts')
    .update({
        ...parsed.data,
        updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .select(ACCOUNT_SELECT_QUERY)
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
  const dopTotal = accounts
    .filter(a => a.currency === 'DOP')
    .reduce((sum, a) => sum + (a.current_balance || 0), 0)

  const usdAccounts = accounts.filter(a => a.currency === 'USD')
  if (usdAccounts.length === 0) return dopTotal

  const rates = await Promise.all(
    usdAccounts.map(a =>
      getSmartRate(a.institution?.id || a.institution_id, Operation.BUY)
        .then(r => ({ balance: a.current_balance || 0, rate: r?.rate ?? 58.00 }))
    )
  )

  const usdTotal = rates.reduce((sum, r) => sum + r.balance * r.rate, 0)
  return dopTotal + usdTotal
}