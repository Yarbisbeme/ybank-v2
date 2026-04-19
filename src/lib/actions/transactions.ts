'use server'

import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { revalidatePath } from 'next/cache'
import { Transaction, GetTransactionsParams, CreateTransactionInput } from '@/types/index'
import { getSmartRate } from '@/services/currency'

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
// =================================================================================
  // ⚡️ AUTO-CÁLCULO DE DIVISAS (YB-13 Integration)
  // =================================================================================
  if (input.type === 'transfer' && input.transfer_to_account_id) {
    
    // A. Buscamos las monedas de ambas cuentas
    const { data: accounts, error: accError } = await supabase
      .from('accounts')
      .select('id, currency, institution_id')
      .in('id', [input.account_id, input.transfer_to_account_id])

    if (accError || !accounts || accounts.length !== 2) {
      return { success: false, error: 'Error leyendo cuentas para conversión' }
    }

    const sourceAcc = accounts.find(a => a.id === input.account_id)
    const targetAcc = accounts.find(a => a.id === input.transfer_to_account_id)

    // B. Si las monedas son DIFERENTES, calculamos la tasa
    if (sourceAcc && targetAcc && sourceAcc.currency !== targetAcc.currency) {
      
      let operation: 'buy' | 'sell' = 'sell'; // Valor por defecto
      let calculatedTargetAmount = 0;

      // CASO 1: USD -> DOP (El banco COMPRA tus dólares)
      if (sourceAcc.currency === 'USD' && targetAcc.currency === 'DOP') {
        operation = 'buy';
      } 
      // CASO 2: DOP -> USD (El banco te VENDE dólares)
      else if (sourceAcc.currency === 'DOP' && targetAcc.currency === 'USD') {
        operation = 'sell';
      }

      // C. Llamamos al servicio de tasas (Smart Rate)
      // Usamos la institución de la cuenta ORIGEN para buscar la tasa
      const rateInfo = await getSmartRate(sourceAcc.institution_id || '', operation)

      if (rateInfo) {
        cleanInput.exchange_rate = rateInfo.rate; // Guardamos la tasa usada

        // D. Calculamos el monto final
        if (operation === 'buy') {
           // 100 USD * 60.50 = 6050 DOP
           calculatedTargetAmount = input.amount * rateInfo.rate;
        } else {
           // 6350 DOP / 63.50 = 100 USD
           calculatedTargetAmount = input.amount / rateInfo.rate;
        }
        
        // Redondeamos a 2 decimales
        cleanInput.target_amount = Number(calculatedTargetAmount.toFixed(2));
      }
    }
  }
  // =================================================================================

  // 2. INSERTAMOS LA TRANSACCIÓN
  const { data: newTx, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      ...cleanInput,
      status: 'posted'
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error al crear transacción:', error)
    return { success: false, error: error.message }
  }

  // 3. VINCULAMOS LOS TAGS
  if (tagsIds.length > 0 && newTx) {
    const tagInserts = tagsIds.map(tagId => ({
      transaction_id: newTx.id,
      tag_id: tagId
    }))
    await supabase.from('transaction_tags').insert(tagInserts)
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