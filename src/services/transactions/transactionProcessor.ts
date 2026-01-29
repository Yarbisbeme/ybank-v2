import { createClient } from '@supabase/supabase-js'; // Cliente Admin para procesos backend
import { getSmartRate } from '@/lib/utils'; // Tu utilidad de tasa
import { IncomingTransactionJSON } from '@/types/database.types';
// Definimos la estructura del JSON que entra


export async function processAiTransaction(data: IncomingTransactionJSON) {
  // Usamos cliente Admin porque esto corre en background, no hay sesión de navegador
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // ¡OJO! Usar Service Key para background jobs
  );

  try {
    // 1. IDENTIFICAR USUARIO
    const { data: userData } = await supabase
      .from('auth.users') 
      .select('id')
      .eq('email', data.user_email)
      .single();
      
    // Si no tienes acceso a auth.users directo por RLS, buscar en tu tabla 'users' pública si tienes una,
    // o asumir que el ID viene en el payload si n8n ya lo resolvió.
    const userId = userData?.id; 

    // 2. IDENTIFICAR CUENTAS (MATCHING)
    // Aquí buscamos las cuentas basándonos en los últimos 4 dígitos que leyó la IA
    const { data: accounts } = await supabase
      .from('accounts')
      .select(`id, currency, institution:institutions(exchange_rate_adjustment)`)
      .eq('user_id', userId)
      .in('last_4_digits', [data.source_last_4, data.target_last_4]);

    // Lógica simple para distinguir cuál es cuál
    const sourceAccount = accounts?.find(a => a.currency === data.source_currency);
    const targetAccount = accounts?.find(a => a.currency === data.target_currency);

    if (!sourceAccount || !targetAccount) throw new Error("Cuentas no encontradas");


    // 3. CALCULAR TASAS AUTOMÁTICAMENTE 🤖
    let finalAmount = data.amount_paid;    // 1000 DOP
    let finalTargetAmount = data.amount_paid; // Default
    let exchangeRate = 1;

    // Si es pago de tarjeta en otra moneda (DOP -> USD)
    if (sourceAccount.currency !== targetAccount.currency) {
      
      // A. Sacamos el margen del banco desde la BD (Sin intervención humana)
      const institutionData = Array.isArray(sourceAccount.institution) 
        ? sourceAccount.institution[0] 
        : sourceAccount.institution;
      const margin = institutionData?.exchange_rate_adjustment || 1.50;

      // B. Calculamos la tasa HOY
      exchangeRate = await getSmartRate(margin); // Ej: 64.20

      // C. Convertimos
      if (sourceAccount.currency === 'DOP' && targetAccount.currency === 'USD') {
        // 1000 DOP / 64.20 = 15.57 USD que entran a la tarjeta
        finalTargetAmount = parseFloat((data.amount_paid / exchangeRate).toFixed(2));
      }
    }

    // 4. INSERTAR EN LA BD
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      account_id: sourceAccount.id,            // Origen
      transfer_to_account_id: targetAccount.id, // Destino
      type: 'transfer', // Un pago de tarjeta es técnicamente una transferencia entre tus cuentas
      amount: finalAmount,        // 1000
      target_amount: finalTargetAmount, // 15.57
      exchange_rate: exchangeRate,      // 64.20
      description: data.description || `Pago Tarjeta ${data.bank_name}`,
      date: data.date,
      status: 'posted'
    });

    if (error) throw error;
    return { success: true, inserted_usd: finalTargetAmount };

  } catch (error) {
    console.error("Error procesando IA Transaction:", error);
    return { success: false, error };
  }
}