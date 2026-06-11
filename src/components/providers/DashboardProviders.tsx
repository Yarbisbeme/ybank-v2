'use client';

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import QueryProvider from './QueryProvider';
import ModalProvider from './ModalProvider';
import StoreInitializer from './StoreInitializer';

// 💡 1. Importaciones nuevas para el vigilante de sesión
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

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

// 🛡️ NUEVO COMPONENTE: El Vigilante Activo de Sesión
function AuthWatcher() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Escucha eventos de autenticación en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Si el usuario cierra sesión explícitamente o el token muere
      if (event === 'SIGNED_OUT') {
        console.log("🔒 [YBank Auth] Sesión terminada. Limpiando datos...");
        
        // Vaciamos la memoria caché para evitar el "Modo Fantasma"
        queryClient.clear();
        
        // Expulsamos al usuario de vuelta al login y forzamos el refresco del Layout
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