'use server'

import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { SmartRateResult } from '@/types/index'

const API_URL = 'https://open.er-api.com/v6/latest/USD';

const FALLBACK_RATE = 60.50;

async function fetchMarketRate(): Promise<number> {
  try {
    // Revalidamos cada 1 hora (3600 segundos)
    const response = await fetch(API_URL, { next: { revalidate: 3600 } });
    
    if (!response.ok) throw new Error('Error en API de Divisas');
    
    const data = await response.json();
    const rate = data.rates.DOP; // Extraemos el valor del Peso Dominicano
    
    if (!rate) throw new Error('No se encontró tasa DOP');

    return rate;
  } catch (error) {
    console.error('⚠️ Usando Tasa Fallback:', error);
    return FALLBACK_RATE;
  }
}

export async function getSmartRate(institutionId: string, type: 'buy' | 'sell'): Promise<SmartRateResult | null> {
    const supabase = await createSupabaseClient()

    const [marketRate, { data: bank, error }] = await Promise.all([
      fetchMarketRate(),
      supabase
        .from('institutions')
        .select('name, exchange_rate_adjustment, exchange_rate_buy_adjustment')
        .eq('id', institutionId)
        .single()
    ]);

    if (error || !bank) {
        console.error('Error fetching bank info:', error)
        return null
    }

    // 💡 FIX CRÍTICO: Convertimos los strings de la BD a Números reales
    const sellSpread = Number(bank.exchange_rate_adjustment) || 0;
    const buySpread = Number(bank.exchange_rate_buy_adjustment) || 0;

    let finalRate = 0;
    let margin = 0;

    if (type === 'sell') {
        // Tasa de Venta (El banco te vende USD a un precio más caro)
        margin = sellSpread; 
        finalRate = marketRate + margin;
    } else {
        // Tasa de Compra (El banco te compra tus USD a un precio más barato)
        margin = buySpread; 
        finalRate = marketRate - margin;
    }

    return {
        rate: Number(finalRate.toFixed(2)),
        baseRate: Number(marketRate.toFixed(4)),
        margin,
        operation: type,
        institutionName: bank.name
    };
}