'use client';

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import QueryProvider from './QueryProvider';
import ModalProvider from './ModalProvider';
import StoreInitializer from './StoreInitializer';

// 💡 1. Importaciones nuevas para el vigilante de sesión
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/shared/supabase/browser';
import { transactionKeys } from '@/lib/transaction-keys';

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
    transactionsTotal: number;
  };
}

function AuthWatcher() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // 💡 Detectamos si el navegador del cliente tiene conexión activa a internet
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      // 2. La app arranca (INITIAL_SESSION), estamos ONLINE, pero la sesión es inválida (!session)
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session && isOnline)) {
        queryClient.clear();
        router.push('/sign-in');
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, queryClient]);

  return null;
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
      // Server data is the unfiltered, global first page. The hook applies a
      // client-side date sanitation in its queryFn; rows are passed as-is here.
      queryClient.setQueryData(transactionKeys.list({ page: 1 }), {
        transactions: initialData.transactions,
        total: initialData.transactionsTotal,
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
      {/* 💡 2. Inyectamos nuestro vigilante dentro del QueryProvider para que tenga acceso a limpiar la caché */}
      <AuthWatcher />
      
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