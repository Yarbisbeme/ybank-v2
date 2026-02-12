'use server'

import { TransactionType, GetTransactionsParams, CreateTransactionInput } from '@/types/index'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { de } from 'date-fns/locale'
import { revalidatePath } from 'next/cache'
import { Transaction } from '@/types/index'

export async function getTransactions( {page = 1, pageSize = 20, accountId} : GetTransactionsParams) {
    const supabase = await createSupabaseClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    //Consulta basica con paginación
    let query = supabase
        .from('transactions')
        .select(`*,
            category:categories(name, icon, color),
            account:accounts(name,currency),
            transfer_to_account:accounts(name,currency)`, 
            { count: 'exact' }) // Para obtener el total de registros
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }) // Orden secundario para consistencia
        .range(from, to)
    
    if (accountId) {
        query = query.or(`account_id.eq.${accountId},transfer_to_account_id.eq.${accountId}`)
    }

    const { data, error, count } = await query

    if (error) {
        console.error('Error al traer transacciones:', error)
        return { transactions: [], total: 0 }
    }

    return { transactions: data as unknown as Transaction[], total: count || 0 }
}

export async function createTransaction(input: CreateTransactionInput) {
    const supabase = await createSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Usuario no autenticado' }

    const cleanInput = { ...input }

    if (input.type === 'transfer') {
        delete cleanInput.category_id // No se asigna categoría a transferencias
        delete cleanInput.exchange_rate // Se calcula en backend
        delete cleanInput.target_amount // Se calcula en backend
    }

    const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        ...cleanInput,
        status: 'posted' // Por ahora, todas se crean como "posted". En el futuro podríamos permitir "pending" para transacciones futuras.
    })

    if (error) {
        console.error('Error al crear transacción:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('dashboard') 
    revalidatePath('dashboard/transactions') // Revalida la página de transacciones para mostrar la nueva entrada
    return { success: true }
}

export async function updateTransaction(id: string, input: Partial<CreateTransactionInput>) {
    const supabase = await createSupabaseClient()
    
    const { error } = await supabase
    .from('transactions')
    .update(input)
    .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')
    return { success: true }
}

export async function deleteTransaction(id: string) {
    const supabase = await createSupabaseClient()

    const { error } = await supabase
    .from('transactions')
    .update({ status: 'deleted' })
    .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')
    return { success: true }
}