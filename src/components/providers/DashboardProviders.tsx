'use client';

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import QueryProvider from './QueryProvider';
import ModalProvider from './ModalProvider';
import StoreInitializer from './StoreInitializer';

interface DashboardProvidersProps {
  children: React.ReactNode;
  primaryAccountId: string | null;
  institutionId: string | null;
  initialData: {
    accounts: any[];
    tags: any[];
    categories: any[];
    institutions: any[];
    transactions: any[];
  };
}

// 💧 Este componente se encarga de inyectar los datos del servidor a la caché de TanStack Query
function DataHydrator({ initialData }: { initialData: DashboardProvidersProps['initialData'] }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 💡 REGLA DE ORO: Solo "pisamos" la caché si el servidor nos dio datos reales (> 0).
    // Si estamos offline y el servidor envió [], no hacemos nada y dejamos que IndexedDB mande.
    
    if (initialData.accounts && initialData.accounts.length > 0) {
      queryClient.setQueryData(['accounts'], initialData.accounts);
    }
    
    if (initialData.tags && initialData.tags.length > 0) {
      queryClient.setQueryData(['tags'], initialData.tags);
    }
    
    if (initialData.categories && initialData.categories.length > 0) {
      queryClient.setQueryData(['categories'], initialData.categories);
    }
    
    if (initialData.institutions && initialData.institutions.length > 0) {
      queryClient.setQueryData(['institutions'], initialData.institutions);
    }
    
    if (initialData.transactions && initialData.transactions.length > 0) {
      // ⚠️ IMPORTANTE: Esta llave debe coincidir EXACTAMENTE con la que usas en useTransactionsList
      queryClient.setQueryData(['transactions', '', '', '', '', '', 1], {
        transactions: initialData.transactions,
        total: initialData.transactions.length
      });
    }
  }, [initialData, queryClient]);

  return null;
}

export default function DashboardProviders({
  children,
  primaryAccountId,
  institutionId,
  initialData,
}: DashboardProvidersProps): React.JSX.Element {
  return (
    <QueryProvider>
      {/* El Hydrator debe estar dentro del QueryProvider */}
      <DataHydrator initialData={initialData} />
      
      <StoreInitializer 
        primaryAccountId={primaryAccountId} 
        institutionId={institutionId} 
      />
      <ModalProvider />
      {children}
    </QueryProvider>
  );
}