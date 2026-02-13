'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Account, AccountType, CurrencyCode } from '@/types'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'

// Definimos qué datos necesitamos para CREAR una cuenta (sin ID, sin fechas)
interface CreateAccountInput {
  name: string;
  institution_id: string; // El ID del Banco seleccionado
  type: AccountType;
  currency: CurrencyCode;
  initial_balance: number;
  last_4_digits?: string; // Opcional
  credit_limit?: number;  // Opcional
}

// Definimos qué datos podemos ACTUALIZAR (Partial permite que no sean todos obligatorios)
interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  last_4_digits?: string;
  credit_limit?: number;
  is_active?: boolean;
  // NOTA: No incluimos balance aquí para evitar romper la contabilidad.
  // El balance se debe modificar solo a través de Transacciones.
}

// =========================================================
// 1. GET (READ ALL) - Traer todas las cuentas activas
// =========================================================
export async function getAccounts() {
  const supabase = await createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        institution:institutions (
          id, name, logo_url, exchange_rate_adjustment
        )
      `)
      .eq('is_active', true) // Solo cuentas activas
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error al traer cuentas:', error)
      return []
    }

    return data as unknown as Account[]
  } catch (error) {
    console.error('Error inesperado:', error)
    return []
  }
}

// =========================================================
// 2. GET BY ID (READ ONE) - Para editar una cuenta específica
// =========================================================
export async function getAccountById(id: string) {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('accounts')
    .select(`*, institution:institutions(*)`)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as Account
}

// =========================================================
// 3. CREATE (INSERT) - Crear nueva cuenta
// =========================================================
export async function createAccount(input: CreateAccountInput) {
  const supabase = await createSupabaseClient()

  // 1. Validar usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuario no autenticado' }

  // 2. Insertar
  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: input.name,
    institution_id: input.institution_id,
    type: input.type,
    currency: input.currency,
    initial_balance: input.initial_balance,
    current_balance: input.initial_balance, // Al inicio, el actual es igual al inicial
    last_4_digits: input.last_4_digits || null,
    credit_limit: input.credit_limit || null,
    is_active: true
  })

  if (error) {
    console.error('Error creando cuenta:', error)
    return { success: false, error: error.message }
  }

  // 3. Refrescar datos
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/accounts')
  return { success: true }
}

// =========================================================
// 4. UPDATE (PATCH) - Modificar datos de una cuenta
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

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/accounts')
  return { success: true }
}

// =========================================================
// 5. ARCHIVE (DELETE LOGICO) - Eliminar cuenta (Ocultar)
// =========================================================
export async function archiveAccount(accountId: string) {
  const supabase = await createSupabaseClient()

  try {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false }) // Soft Delete
      .eq('id', accountId)

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getInstitutions() {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('institutions')
    .select('id, name')
    .order('name')

  if (error) return []
  return data
}