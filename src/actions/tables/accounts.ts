'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Account } from '@/types/database.types'

export async function getAccounts() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {} // No necesitamos setear cookies para leer datos
      }
    }
  )

  try {
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        institution:institutions(name, logo_url)
      `)
      .eq('is_active', true) // Solo cuentas activas
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching accounts:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Account[] }

  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Error inesperado al cargar cuentas' }
  }
}