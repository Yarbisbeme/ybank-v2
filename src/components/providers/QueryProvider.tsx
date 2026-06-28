'use client'

import { QueryClient, useIsRestoring } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { useState, useEffect } from 'react'

function RestoreGatekeeper({ children }: { children: React.ReactNode }) {
  const isRestoring = useIsRestoring();

  if (isRestoring) {
    return null; 
  }

  return <>{children}</>;
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 60, 
        gcTime: 1000 * 60 * 60 * 24 * 7, 
        networkMode: 'offlineFirst',
      },
    },
  }))

  const [persister, setPersister] = useState<ReturnType<typeof createAsyncStoragePersister> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('idb-keyval').then(({ get, set, del }) => {
        const idbPersister = createAsyncStoragePersister({
          storage: {
            getItem: async (key) => {
              const data = await get(`ybank-offline-${key}`);
              return data;
            },
            setItem: async (key, value) => {
              await set(`ybank-offline-${key}`, value);
            },
            removeItem: async (key) => await del(`ybank-offline-${key}`),
          },
        })
        setPersister(idbPersister);
      }).catch((err) => {
        console.error("[IDB] Error al importar idb-keyval:", err);
      });
    }
  }, []);

  if (!persister) {
    return null; 
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ 
        persister, 
        maxAge: 1000 * 60 * 60 * 24 * 7 
      }}
    >
      <RestoreGatekeeper>
        {children}
      </RestoreGatekeeper>
    </PersistQueryClientProvider>
  )
}
