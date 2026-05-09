'use client'

import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister' 
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

  const [persister, setPersister] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('idb-keyval').then(({ get, set, del }) => {
        const idbValidKey = (key: string) => `ybank-offline-${key}`;
        
        // 💡 2. Usamos createAsyncStoragePersister (ideal para IndexedDB)
        const idbPersister = createAsyncStoragePersister({
          storage: {
            getItem: async (key) => await get(idbValidKey(key)),
            setItem: async (key, value) => await set(idbValidKey(key), value),
            removeItem: async (key) => await del(idbValidKey(key)),
          },
        });
        
        setPersister(idbPersister);
      });
    }
  }, []);

  if (!persister) {
     return children; 
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ 
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7, 
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}