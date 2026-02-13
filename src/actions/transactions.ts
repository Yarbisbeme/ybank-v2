'use server'

import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { revalidatePath } from 'next/cache'
import { Transaction, GetTransactionsParams, CreateTransactionInput } from '@/types/index'

export async function getTransactions({ page = 1, pageSize = 20, accountId }: GetTransactionsParams) {
    const supabase = await createSupabaseClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
        .from('transactions')
        .select(`
            *,
            category:categories(name, icon, color),
            account:accounts!account_id(name, currency), 
            transfer_to_account:accounts!transfer_to_account_id(name, currency),
            tags ( id, name ) 
            
        `, { count: 'exact' }) // <--- OJO: Solo 'tags ( id, name )' una vez.
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
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

// ==========================================
// 2. CREATE TRANSACTION (Corregido)
// ==========================================
export async function createTransaction(input: CreateTransactionInput) {
    const supabase = await createSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Usuario no autenticado' }

    // ⚠️ CORRECCIÓN IMPORTANTE:
    // No borramos target_amount ni exchange_rate si es transferencia.
    // Asumimos que el Frontend (o quien llame a esta función) YA calculó los valores.
    const cleanInput = { ...input }

    const tagsIds = input.tags || []
    delete (cleanInput as any).tags // Eliminamos tags del input principal

    // Solo limpiamos si NO es transferencia, para no ensuciar la BD
    if (input.type !== 'transfer') {
        delete cleanInput.transfer_to_account_id
        delete cleanInput.target_amount
        delete cleanInput.exchange_rate
    } else {
        // Si es transferencia, quitamos category_id
        delete cleanInput.category_id 
    }

    const { data: newTx, error } = await supabase
        .from('transactions')
        .insert({
        user_id: user.id,
        ...cleanInput,
        status: 'posted' // Por defecto, las transacciones se crean como 'posted'
        })
        .select('id') // Necesitamos el ID para insertar en transaction_tags
        .single()

    if (error) {
        console.error('Error al crear transacción:', error)
        return { success: false, error: error.message }
    }

    // 2. INSERTAMOS LOS TAGS (Tabla Intermedia)
    if (tagsIds.length > 0 && newTx) {
        // Preparamos el array para insertar de golpe
        const tagInserts = tagsIds.map(tagId => ({
            transaction_id: newTx.id,
            tag_id: tagId
        }))

        const { error: tagError } = await supabase
            .from('transaction_tags')
            .insert(tagInserts)
        
        if (tagError) console.error('Error guardando tags:', tagError)
    }

    revalidatePath('/dashboard') 
    revalidatePath('/dashboard/transactions')
    return { success: true }
}

// ==========================================
// 3. UPDATE TRANSACTION
// ==========================================
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

// ==========================================
// 4. DELETE TRANSACTION (Corregido)
// ==========================================
export async function deleteTransaction(id: string) {
    const supabase = await createSupabaseClient()

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