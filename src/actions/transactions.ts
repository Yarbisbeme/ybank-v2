'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Transaction, GetTransactionsParams, CreateTransactionInput } from '@/types/index'

// ==========================================
// 1. GET TRANSACTIONS (Corregido)
// ==========================================
export async function getTransactions({ page = 1, pageSize = 20, accountId }: GetTransactionsParams) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Construimos la consulta
    let query = supabase
        .from('transactions')
        .select(`
            *,
            category:categories(name, icon, color),
            account:accounts!account_id(name, currency), 
            transfer_to_account:accounts!transfer_to_account_id(name, currency)
        `, { count: 'exact' })
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)
    
    // Filtro por cuenta (Origen O Destino)
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

// ==========================================
// 2. CREATE TRANSACTION (Corregido)
// ==========================================
export async function createTransaction(input: CreateTransactionInput) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Usuario no autenticado' }

    // ⚠️ CORRECCIÓN IMPORTANTE:
    // No borramos target_amount ni exchange_rate si es transferencia.
    // Asumimos que el Frontend (o quien llame a esta función) YA calculó los valores.
    const cleanInput = { ...input }

    // Solo limpiamos si NO es transferencia, para no ensuciar la BD
    if (input.type !== 'transfer') {
        delete cleanInput.transfer_to_account_id
        delete cleanInput.target_amount
        delete cleanInput.exchange_rate
    } else {
        // Si es transferencia, quitamos category_id
        delete cleanInput.category_id 
    }

    const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        ...cleanInput,
        status: 'posted' 
    })

    if (error) {
        console.error('Error al crear transacción:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard') 
    revalidatePath('/dashboard/transactions')
    return { success: true }
}

// ==========================================
// 3. UPDATE TRANSACTION
// ==========================================
export async function updateTransaction(id: string, input: Partial<CreateTransactionInput>) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    
    const { error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')
    return { success: true }
}

// ==========================================
// 4. DELETE TRANSACTION (Corregido)
// ==========================================
export async function deleteTransaction(id: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )

    // ⚠️ CORRECCIÓN: Usamos DELETE físico.
    // Esto dispara el Trigger 'trg_update_balances' (TG_OP = 'DELETE')
    // el cual se encarga de DEVOLVER el dinero a las cuentas.
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')
    return { success: true }
}