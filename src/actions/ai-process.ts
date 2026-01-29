'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSmartRate } from '@/lib/utils' // Tu utilidad

// La estructura exacta que esperamos de la IA
interface AiTransactionInput {
  user_email: string;
  bank_name: string;
  transaction_type: string;
  source_currency: string;
  target_currency: string;
  amount_paid: number;
  source_last_4: string;
  target_last_4: string;
  date: string;
  description: string;
}

export async function processAiJson(jsonData: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  try {
    // 1. Parsear el JSON
    const data: AiTransactionInput = JSON.parse(jsonData);
    const user = (await supabase.auth.getUser()).data.user;

    if (!user) return { success: false, error: "Usuario no autenticado" };

    // 2. Buscar Cuentas por 'last_4_digits'
    // Buscamos ambas cuentas de un solo golpe
    const { data: accounts } = await supabase
      .from('accounts')
      .select(`
        id, 
        currency, 
        last_4_digits,
        current_balance,
        institution:institutions(exchange_rate_adjustment)
      `)
      .eq('user_id', user.id)
      .in('last_4_digits', [data.source_last_4, data.target_last_4]);

    if (!accounts || accounts.length < 2) {
        return { success: false, error: `No encontré las cuentas terminadas en ${data.source_last_4} y ${data.target_last_4}` };
    }

    // Identificar cuál es cual basándonos en la moneda del JSON
    const sourceAccount = accounts.find(a => a.currency === data.source_currency && a.last_4_digits === data.source_last_4);
    const targetAccount = accounts.find(a => a.currency === data.target_currency && a.last_4_digits === data.target_last_4);

    if (!sourceAccount || !targetAccount) {
        return { success: false, error: "Las monedas del JSON no coinciden con las cuentas encontradas." };
    }

    // 3. Lógica de Conversión Automática (Smart Rate)
    let finalAmount = data.amount_paid;    
    let finalTargetAmount = data.amount_paid;
    let exchangeRate = 1;
    let logMessage = "Misma moneda, sin conversión.";

    if (sourceAccount.currency !== targetAccount.currency) {
      // Obtener margen del banco (con manejo seguro de arrays)
      const instData = Array.isArray(sourceAccount.institution) ? sourceAccount.institution[0] : sourceAccount.institution;
      const margin = instData?.exchange_rate_adjustment || 1.50;

      // Calcular tasa
      exchangeRate = await getSmartRate(margin);
      
      // Convertir (DOP -> USD)
      if (sourceAccount.currency === 'DOP' && targetAccount.currency === 'USD') {
        finalTargetAmount = parseFloat((data.amount_paid / exchangeRate).toFixed(2));
        logMessage = `Conversión aplicada: Tasa ${exchangeRate}. ${data.amount_paid} DOP = ${finalTargetAmount} USD`;
      }
    }

    // 4. Insertar Transacción
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: sourceAccount.id,
      transfer_to_account_id: targetAccount.id,
      type: 'transfer',
      description: data.description,
      date: data.date,
      amount: finalAmount,
      target_amount: finalTargetAmount,
      exchange_rate: exchangeRate
    });

    if (error) throw error;

    return { success: true, message: logMessage, details: { rate: exchangeRate, usd_amount: finalTargetAmount } };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}