'use server'
import { createClient } from "@/lib/supabase/Server";
import { revalidatePath } from 'next/cache'
import { getSmartRate } from '@/lib/utils' 

const trasnferencia = {
  "user_email": "yarbisbeltre@gmail.com",
  "bank_name": "Banco Popular",
  "transaction_type": "credit_card_payment", // O 'transfer'
  "source_currency": "DOP",
  "target_currency": "USD",
  "amount_paid": 1000.00, // Lo que salió de la cuenta de pesos
  "source_last_4": "1234", // Dato clave para saber de qué cuenta salió
  "target_last_4": "4288", // Dato clave para saber qué tarjeta se pagó
  "date": "2026-01-29T10:00:00Z"
}
;

export async function createTransfer(prevState: any, formData: FormData) {

  const supabase = await createClient();

  // 1. Recibir datos del Formulario
  // Asegúrate que los <input name="..."> coincidan con estos nombres
  const sourceAccountId = formData.get('source_account_id') as string;
  const destinationAccountId = formData.get('transfer_to_account_id') as string;
  const rawAmount = parseFloat(formData.get('amount') as string); // El monto que SALE
  const description = formData.get('description') as string;
  const date = formData.get('date') as string || new Date().toISOString();

  // Validaciones básicas
  if (!sourceAccountId || !destinationAccountId) {
    return { success: false, error: 'Cuentas origen y destino requeridas' };
  }
  if (!rawAmount || rawAmount <= 0) {
    return { success: false, error: 'El monto debe ser mayor a 0' };
  }

  try {
    // 2. Obtener datos de las cuentas (Necesitamos saber su MONEDA y su BANCO)
    const { data: accounts, error: fetchError } = await supabase
      .from('accounts')
      .select(`
        id, 
        currency, 
        type,
        institution:institutions(exchange_rate_adjustment) 
      `)
      .in('id', [sourceAccountId, destinationAccountId]);

    if (fetchError || !accounts || accounts.length !== 2) {
      throw new Error("Error obteniendo información de las cuentas");
    }

    // Identificar cuál es cuál
    const source = accounts.find(a => a.id === sourceAccountId)!;
    const dest = accounts.find(a => a.id === destinationAccountId)!;

    // 3. Lógica de Conversión Automática (DOP <-> USD)
    let finalAmount = rawAmount;          // Lo que sale de Origen
    let finalTargetAmount = rawAmount;    // Lo que entra a Destino (Default: igual)
    let exchangeRate = 1;                 // Tasa (Default: 1 a 1)

    // Si las monedas son diferentes, calculamos:
    if (source.currency !== dest.currency) {
      
      // A. Obtenemos el margen del banco (Si es null, usamos 1.50 por defecto)
      // Usamos el banco de ORIGEN como referencia para la venta de divisas
      // (Ej: Si pagas desde Popular, usas la tasa del Popular)
      const institutionData = Array.isArray(source.institution) 
        ? source.institution[0] // Si es array, tomamos el primero
        : source.institution;   // Si es objeto, lo usamos directo

      const bankMargin = institutionData?.exchange_rate_adjustment || 1.50;

      // B. Llamamos a tu utilidad inteligente
      exchangeRate = await getSmartRate(Number(bankMargin));

      // C. Aplicamos la matemática según la dirección del cambio
      
      // CASO 1: Tienes Pesos -> Pagas Tarjeta en Dólares (División)
      if (source.currency === 'DOP' && dest.currency === 'USD') {
        // Ej: 1000 DOP / 64.20 = 15.57 USD
        finalTargetAmount = parseFloat((rawAmount / exchangeRate).toFixed(2));
      } 
      
      // CASO 2: Tienes Dólares -> Cambias a Pesos (Multiplicación)
      else if (source.currency === 'USD' && dest.currency === 'DOP') {
        // Ej: 100 USD * 64.20 = 6420 DOP
        finalTargetAmount = parseFloat((rawAmount * exchangeRate).toFixed(2));
      }
    }

    // 4. Insertar la Transacción en BD
    const user = (await supabase.auth.getUser()).data.user;

    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: user?.id,
      account_id: sourceAccountId,
      transfer_to_account_id: destinationAccountId, // ¡CRUCIAL PARA EL TRIGGER!
      category_id: null, // Transferencias no suelen llevar categoría, o una genérica
      type: 'transfer',
      description: description || 'Transferencia',
      date: date,
      
      // === LA MAGIA ===
      amount: finalAmount,             // Resta esto en Origen
      target_amount: finalTargetAmount,// Suma esto en Destino
      exchange_rate: exchangeRate      // Guarda a cuánto estaba el dólar
    });

    if (insertError) throw insertError;

    // 5. Actualizar la UI
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/accounts');
    
    return { success: true, message: 'Transferencia realizada correctamente' };

  } catch (error: any) {
    console.error('Error procesando transferencia:', error);
    return { success: false, error: error.message || 'Error desconocido' };
  }
}