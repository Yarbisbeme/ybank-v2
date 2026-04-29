'use client'

import { useYBankStore } from '@/hooks/useYBankStore';
import { useRef } from 'react'

interface StoreInitializerProps {
  primaryAccountId: string | null;
  institutionId: string | null; // 💡 Nuevo prop
}

export default function StoreInitializer({ primaryAccountId, institutionId }: StoreInitializerProps) {
  const initialized = useRef(false)

  if (!initialized.current) {
    // 1. Guardamos la configuración en Zustand
    useYBankStore.setState({ 
      preferredAccountId: primaryAccountId,
    });
    
    // 2. 💡 EL AMARRE: Disparamos el cálculo si tenemos el banco
    if (institutionId) {
       useYBankStore.getState().updateRateContext(institutionId);
    }
    
    initialized.current = true;
  }

  return null;
}