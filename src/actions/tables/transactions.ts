// En actions/transactions.ts

import { createClient } from "@/lib/supabase/Server";

export async function createTransaction(formData: any, tagIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Insertar la Transacción primero
  const { data: transaction, error: transError } = await supabase
    .from('transactions')
    .insert({ ...formData, user_id: user?.id })
    .select()
    .single();

  if (transError || !transaction) return { success: false, error: transError };

  // 2. Si hay tags seleccionados, insertarlos en la tabla intermedia
  if (tagIds && tagIds.length > 0) {
    const tagLinks = tagIds.map((tagId) => ({
      transaction_id: transaction.id, // El ID de la transacción recién creada
      tag_id: tagId
    }));

    const { error: tagError } = await supabase
      .from('transaction_tags')
      .insert(tagLinks);
      
    if (tagError) console.error("Error guardando tags", tagError);
  }

  return { success: true, data: transaction };
}