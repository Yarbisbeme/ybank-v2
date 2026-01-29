//src/lib/utils.tsx

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getSmartRate(bankAdjustment: number = 1.50): Promise<number> {
  try {
    // 1. Buscamos la tasa real del mercado (Google/XE)
    const res = await fetch(API_URL, { next: { revalidate: 3600 } }); 
    const data = await res.json();
    const marketRate = data.rates.DOP; // Ej: 58.50

    // 2. Le sumamos lo que cobra el banco específico
    const finalRate = marketRate + bankAdjustment;

    return parseFloat(finalRate.toFixed(2)); // Ej: 60.00
  } catch (error) {
    console.error("Error API Dolar", error);
    // Fallback: Si falla internet, devolvemos un estimado seguro
    return 60.00; 
  }
}