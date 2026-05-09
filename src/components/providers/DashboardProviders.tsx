'use client';

import React from 'react';
import QueryProvider from './QueryProvider'; // 💡 Ruta relativa para evitar problemas de alias temporalmente
import ModalProvider from './ModalProvider';
import StoreInitializer from './StoreInitializer';

interface DashboardProvidersProps {
  children: React.ReactNode;
  primaryAccountId: string | null;
  institutionId: string | null;
}

export default function DashboardProviders({
  children,
  primaryAccountId,
  institutionId,
}: DashboardProvidersProps): React.JSX.Element { // 💡 Le decimos explícitamente a TS que esto devuelve JSX
  return (
    <QueryProvider>
      <StoreInitializer 
        primaryAccountId={primaryAccountId} 
        institutionId={institutionId} 
      />
      <ModalProvider />
      {children}
    </QueryProvider>
  );
}