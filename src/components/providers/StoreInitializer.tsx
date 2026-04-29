'use client'

import { useYBankStore } from '@/store/useYBankStore';
import { useRef, useEffect } from 'react';

interface StoreInitializerProps {
  primaryAccountId: string | null;
  institutionId: string | null;
}

export default function StoreInitializer({ primaryAccountId, institutionId }: StoreInitializerProps) {
  // 1. HIDRATACIÓN SÍNCRONA (Evita el flickering inicial)
  const initialized = useRef(false);

  if (!initialized.current) {
    useYBankStore.setState({ 
      preferredAccountId: primaryAccountId,
    });
    initialized.current = true;
  }

  // 2. SIDE EFFECT ASÍNCRONO (Llamada al servidor segura)
  useEffect(() => {
    // Esto se ejecuta justo después de que React termine de montar la pantalla
    if (institutionId) {
       useYBankStore.getState().updateRateContext(institutionId);
    }
  }, [institutionId]); // Se re-ejecuta solo si el banco cambia

  return null;
}