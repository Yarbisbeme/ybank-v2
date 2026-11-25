'use client'

import { QueryClient, useIsRestoring, type Query } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { del, get, set } from 'idb-keyval'
import { useState } from 'react'

const STORAGE_PREFIX = 'ybank-offline-'
const MAX_AGE = 1000 * 60 * 60 * 24 * 7

// Only data the app needs offline is written to IndexedDB. Search previews are
// throwaway; failed or pending queries carry nothing worth restoring.
const NOT_PERSISTED = new Set(['global-search'])
function shouldPersist(query: Query): boolean {
  return query.state.status === 'success' && !NOT_PERSISTED.has(String(query.queryKey[0]))
}

function RestoreGatekeeper({ children }: { children: React.ReactNode }) {
  // Restoring from IndexedDB takes milliseconds; rendering before it finishes
  // would flash empty states. Full SSR of the dashboard comes with
  // HydrationBoundary in Phase 3.
  return useIsRestoring() ? null : <>{children}</>
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 60,
        gcTime: MAX_AGE,
        networkMode: 'offlineFirst',
      },
    },
  }))

  // idb-keyval only touches IndexedDB when called, so creating the persister is
  // safe during SSR; the provider restores on the client.
  const [persister] = useState(() => createAsyncStoragePersister({
    storage: {
      getItem: (key) => get(`${STORAGE_PREFIX}${key}`),
      setItem: (key, value) => set(`${STORAGE_PREFIX}${key}`, value),
      removeItem: (key) => del(`${STORAGE_PREFIX}${key}`),
    },
  }))

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: MAX_AGE,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersist },
      }}
    >
      <RestoreGatekeeper>{children}</RestoreGatekeeper>
    </PersistQueryClientProvider>
  )
}
