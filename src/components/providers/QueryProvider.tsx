'use client'

import { QueryClient, useIsRestoring } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { useState, useEffect } from 'react'

function RestoreGatekeeper({ children }: { children: React.ReactNode }) {
  const isRestoring = useIsRestoring();

  // 🚪 LOG: Vigilar la puerta de la caché
  useEffect(() => {
    console.log(`🚪 [Gatekeeper] isRestoring: ${isRestoring}`);
  }, [isRestoring]);

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

  const [persister, setPersister] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("💾 [IDB] Inicializando conexión con IndexedDB...");
      import('idb-keyval').then(({ get, set, del }) => {
        const idbPersister = createAsyncStoragePersister({
          storage: {
            getItem: async (key) => {
              console.log(`📦 [IDB-GET] Intentando leer la llave: ybank-offline-${key}`);
              const data = await get(`ybank-offline-${key}`);
              console.log(`📦 [IDB-GET] Resultado: ${data ? `¡Datos encontrados! (${data.length} caracteres)` : 'Vacío/Nulo'}`);
              return data;
            },
            setItem: async (key, value) => {
              console.log(`✍️ [IDB-SET] Guardando datos en: ybank-offline-${key}`);
              await set(`ybank-offline-${key}`, value);
            },
            removeItem: async (key) => await del(`ybank-offline-${key}`),
          },
        })
        setPersister(idbPersister);
        console.log("✅ [IDB] Persister configurado y listo.");
      }).catch((err) => {
        console.error("❌ [IDB] Error fatal al importar idb-keyval:", err);
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
      onSuccess={() => console.log("🚀 [TanStack] ¡Hidratación desde IndexedDB completada con éxito!")}
    >
      <RestoreGatekeeper>
        {children}
      </RestoreGatekeeper>
    </PersistQueryClientProvider>
  )
}