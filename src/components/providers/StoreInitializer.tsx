// StoreInitializer.tsx
'use client'

import { useYBankStore } from '@/store/useYBankStore';
import { useRef, useEffect } from 'react';

interface StoreInitializerProps {
  primaryAccountId: string | null;
  institutionId: string | null;
}

export default function StoreInitializer({ primaryAccountId, institutionId }: StoreInitializerProps) {
  const initialized = useRef(false);

  if (!initialized.current) {
    if (primaryAccountId !== null) {
      useYBankStore.setState({ preferredAccountId: primaryAccountId });
    }
    initialized.current = true;
  }

  useEffect(() => {
    if (institutionId) {
       useYBankStore.getState().updateRateContext(institutionId);
    }
  }, [institutionId]);

  return null;
}