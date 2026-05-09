'use server'

import { DGII_CATEGORY_ID, DGII_TAX_RATE } from '@/constants/constants'
import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { getSmartRate } from '@/services/rates'
import { ExtendedGetTransactionsParams } from '@/types/database.types'

// ==========================================
// 1. GET TRANSACTIONS (Con Filtros y Paginación)
// ==========================================
export async function getTransactions({ page = 1, pageSize = 20, accountId, filters }: ExtendedGetTransactionsParams) {
    const supabase = await createSupabaseClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let selectString = `
      *,
      category:categories(name, icon, color),
      account:accounts!account_id(name, currency), 
      transfer_to_account:accounts!transfer_to_account_id(name, currency),
      tags:transaction_tags(tag:tags(id, name)),
      items:transaction_items(*, category:categories(id, name, icon)) 
    `;

    if (filters?.tagId) {
        selectString += `, transaction_tags!inner(tag_id)`
    }

    let query = supabase
        .from('transactions')
        .select(selectString, { count: 'exact' })
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)
    
    if (accountId) query = query.or(`account_id.eq.${accountId},transfer_to_account_id.eq.${accountId}`)
    if (filters?.type) query = query.eq('type', filters.type)
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId)
    if (filters?.startDate) query = query.gte('date', filters.startDate)
    if (filters?.tagId) query = query.eq('transaction_tags.tag_id', filters.tagId)
    if (filters?.endDate) {
        const endOfDay = filters.endDate.includes('T') ? filters.endDate : `${filters.endDate}T23:59:59.999Z`;
        query = query.lte('date', endOfDay)
    }

    const { data, error, count } = await query

    if (error) {
        console.error('Error al traer transacciones:', error)
        return { transactions: [], total: 0 }
    }

    return JSON.parse(JSON.stringify({ 
      transactions: data, 
      total: count || 0 
  }));
}

export async function getTransactionById(id: string) {
  const supabase = await createSupabaseClient()
  const { data, error } = await supabase
      .from('transactions')
      .select(`
      *,
      tags:transaction_tags(tag:tags(*)),
      items:transaction_items(*, category:categories(id, name, icon)) 
      `)
      .eq('id', id)
      .single();

  if (error) throw new Error(error.message);
  return JSON.parse(JSON.stringify(data));
}

// ==========================================
// 2. SAVE TRANSACTION
// ==========================================
export async function saveTransaction(payload: any) {
    const transactionInput: any = {
        type: payload.type,
        amount: parseFloat(payload.amount),
        date: payload.date,
        description: payload.note, 
        account_id: payload.accountId,
        category_id: payload.categoryId || null,
        transfer_to_account_id: payload.destinationAccountId || null,
        tags: payload.tagIds || [], 
        items: payload.items || [], 
    };

    if (payload.id) {
        return await updateTransaction(payload.id, transactionInput);
    } else {
        return await createTransaction(transactionInput);
    }
}

// ==========================================
// 3. CREATE TRANSACTION
// ==========================================
export async function createTransaction(input: any) {
    const supabase = await createSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Usuario no autenticado' }

    const cleanInput = { ...input }

    const tagsIds = input.tags || []
    let items = input.items || [] 
    delete cleanInput.tags 
    delete cleanInput.items 

    const originalTransferAmount = parseFloat(input.amount);

    if (input.type !== 'transfer') {
        delete cleanInput.transfer_to_account_id
        delete cleanInput.target_amount
        delete cleanInput.exchange_rate
    } else {
        delete cleanInput.category_id 

        // 💡 Uso de la constante
        const dgiiTax = Number((originalTransferAmount * DGII_TAX_RATE).toFixed(2));

        cleanInput.amount = originalTransferAmount + dgiiTax;
        cleanInput.target_amount = originalTransferAmount;

        items = [
            {
                name: 'Monto Transferido',
                unit_price: originalTransferAmount,
                quantity: 1,
                category_id: null
            },
            {
                name: `Comisión DGII (${(DGII_TAX_RATE * 100).toFixed(2)}%)`,
                unit_price: dgiiTax,
                quantity: 1,
                category_id: DGII_CATEGORY_ID // 💡 Uso de la constante
            }
        ];
    }
  
  if (input.type === 'transfer' && input.transfer_to_account_id) {
    const { data: accounts } = await supabase.from('accounts').select('id, currency, institution_id').in('id', [input.account_id, input.transfer_to_account_id])
    if (accounts && accounts.length === 2) {
      const sourceAcc = accounts.find(a => a.id === input.account_id)
      const targetAcc = accounts.find(a => a.id === input.transfer_to_account_id)
      if (sourceAcc && targetAcc && sourceAcc.currency !== targetAcc.currency) {
        let operation: 'buy' | 'sell' = sourceAcc.currency === 'USD' && targetAcc.currency === 'DOP' ? 'buy' : 'sell';
        const rateInfo = await getSmartRate(sourceAcc.institution_id || '', operation)
        if (rateInfo) {
          cleanInput.exchange_rate = rateInfo.rate; 
          cleanInput.target_amount = Number((operation === 'buy' ? originalTransferAmount * rateInfo.rate : originalTransferAmount / rateInfo.rate).toFixed(2));
        }
      }
    }
  }

  // 1. INSERTAMOS LA TRANSACCIÓN PADRE
  const { data: newTx, error } = await supabase
    .from('transactions')
    .insert({ user_id: user.id, ...cleanInput, status: 'posted' })
    // 💡 MEJORA 2: Pedimos que nos devuelva el registro completo insertado
    .select('*') 
    .single()

  if (error) return { success: false, error: error.message }

  // 2. VINCULAMOS LOS TAGS
  if (tagsIds.length > 0 && newTx) {
    const tagInserts = tagsIds.map((tagId: string) => ({ transaction_id: newTx.id, tag_id: tagId }))
    await supabase.from('transaction_tags').insert(tagInserts)
  }

  // 3. VINCULAMOS LOS ÍTEMS
  if (items.length > 0 && newTx) {
    const itemInserts = items.map((item: any) => ({
      transaction_id: newTx.id,
      name: item.name,
      quantity: 1, 
      unit_price: parseFloat(item.unit_price),
      category_id: item.category_id || null
    }))
    
    const { error: itemsError } = await supabase.from('transaction_items').insert(itemInserts)
    
    if (itemsError) {
      console.error('Error insertando subtransacciones:', itemsError);
      await supabase.from('transactions').delete().eq('id', newTx.id);
      return { success: false, error: 'No se pudo guardar el desglose: ' + itemsError.message }
    }
  }

  // 💡 Devolvemos la data real para que TanStack actualice su caché con el ID correcto
  return { success: true, data: newTx }
}

// ==========================================
// 4. UPDATE TRANSACTION
// ==========================================
export async function updateTransaction(id: string, input: any) {
    const supabase = await createSupabaseClient();
    
    const cleanInput = { ...input };
    
    const tagsIds = cleanInput.tags; 
    let items = cleanInput.items; 
    
    delete cleanInput.tags; 
    delete cleanInput.items; 

    const originalTransferAmount = parseFloat(input.amount);

    if (cleanInput.type !== 'transfer') {
        delete cleanInput.transfer_to_account_id;
        delete cleanInput.target_amount;
        delete cleanInput.exchange_rate;
    } else {
        delete cleanInput.category_id;

        const dgiiTax = Number((originalTransferAmount * DGII_TAX_RATE).toFixed(2));

        cleanInput.amount = originalTransferAmount + dgiiTax;
        cleanInput.target_amount = originalTransferAmount;

        items = [
            {
                name: 'Monto Transferido',
                unit_price: originalTransferAmount,
                quantity: 1,
                category_id: null
            },
            {
                name: `Comisión DGII (${(DGII_TAX_RATE * 100).toFixed(2)}%)`,
                unit_price: dgiiTax,
                quantity: 1,
                category_id: DGII_CATEGORY_ID 
            }
        ];
    }

    if (cleanInput.type === 'transfer' && cleanInput.transfer_to_account_id) {
        const { data: accounts } = await supabase
            .from('accounts')
            .select('id, currency, institution_id')
            .in('id', [cleanInput.account_id, cleanInput.transfer_to_account_id]);
            
        if (accounts && accounts.length === 2) {
            const sourceAcc = accounts.find(a => a.id === cleanInput.account_id);
            const targetAcc = accounts.find(a => a.id === cleanInput.transfer_to_account_id);

            if (sourceAcc && targetAcc && sourceAcc.currency !== targetAcc.currency) {
                let operation: 'buy' | 'sell' = sourceAcc.currency === 'USD' && targetAcc.currency === 'DOP' ? 'buy' : 'sell';
                const rateInfo = await getSmartRate(sourceAcc.institution_id || '', operation);
                
                if (rateInfo) {
                    cleanInput.exchange_rate = rateInfo.rate;
                    cleanInput.target_amount = Number((operation === 'buy' ? originalTransferAmount * rateInfo.rate : originalTransferAmount / rateInfo.rate).toFixed(2));
                }
            }
        }
    }

    // 1. ACTUALIZAMOS LA TRANSACCIÓN PADRE
    const { data: updatedTx, error } = await supabase
      .from('transactions')
      .update(cleanInput)
      .eq('id', id)
      .select('*') // 💡 Pedimos la data actualizada
      .single();

    if (error) return { success: false, error: error.message };

    // 2. ACTUALIZAMOS LOS TAGS
    if (tagsIds !== undefined) {
        await supabase.from('transaction_tags').delete().eq('transaction_id', id);
        if (tagsIds.length > 0) {
            const tagInserts = tagsIds.map((tagId: string) => ({ transaction_id: id, tag_id: tagId }));
            await supabase.from('transaction_tags').insert(tagInserts);
        }
    }

    // 3. ACTUALIZAMOS EL DESGLOSE (ITEMS)
    if (items !== undefined) {
        await supabase.from('transaction_items').delete().eq('transaction_id', id);
        
        if (items.length > 0) {
            const itemInserts = items.map((item: any) => ({
                transaction_id: id,
                name: item.name,
                quantity: 1,
                unit_price: parseFloat(item.unit_price),
                category_id: item.category_id || null
            }));
            
            const { error: itemsError } = await supabase.from('transaction_items').insert(itemInserts);
            
            if (itemsError) {
                console.error('Error actualizando subtransacciones:', itemsError);
                return { success: false, error: 'Transacción actualizada, pero falló el desglose de DGII.' };
            }
        }
    }

    return { success: true, data: updatedTx }; // 💡 Devolvemos la data
}

// ==========================================
// 5. UPDATE SUBTRANSACTION
// ==========================================
export async function updateSubTransaction(itemId: string, input: { 
  name: string; 
  unit_price: number; 
  category_id: string;
  quantity: number;
}) {
  const supabase = await createSupabaseClient();
  
  const total_price = input.quantity * input.unit_price;

  const { error } = await supabase
    .from('transaction_items')
    .update({
      name: input.name,
      unit_price: input.unit_price,
      quantity: input.quantity,
      total_price: total_price,
      category_id: input.category_id
    })
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

// ==========================================
// 6. DELETE TRANSACTION
// ==========================================
export async function deleteTransaction(id: string) {
    const supabase = await createSupabaseClient()

    await supabase.from('transaction_tags').delete().eq('transaction_id', id);
    await supabase.from('transaction_items').delete().eq('transaction_id', id);

    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    return { success: true }
}