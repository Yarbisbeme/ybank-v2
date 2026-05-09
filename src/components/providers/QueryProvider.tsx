'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister' 
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { useState, useEffect } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, 
        gcTime: 1000 * 60 * 60 * 24 * 7, 
        refetchOnWindowFocus: true, 
        retry: 2, 
      },
    },
  }))

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== 'undefined') {
      import('idb-keyval').then(({ get, set, del }) => {
        const idbValidKey = (key: string) => `ybank-offline-${key}`;
        
        const idbPersister = createAsyncStoragePersister({
          storage: {
            getItem: async (key) => await get(idbValidKey(key)),
            setItem: async (key, value) => await set(idbValidKey(key), value),
            removeItem: async (key) => await del(idbValidKey(key)),
          },
        });
        
        persistQueryClient({
          queryClient,
          persister: idbPersister,
          maxAge: 1000 * 60 * 60 * 24 * 7,
        });
      }).catch((err) => {
        console.error("Error al inicializar IndexedDB para offline:", err);
      });
    }
  }, [queryClient]);

  if (!isMounted) {
    return null; 
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}