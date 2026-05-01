'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 💡 ESTA ES LA MAGIA: Los datos se considerarán "frescos" por 5 minutos.
            // Si abres un modal y lo cierras en menos de 5 mins, no hará una nueva petición a la BD.
            staleTime: 5 * 60 * 1000, 
            refetchOnWindowFocus: false, // No recargar la BD solo porque cambies de pestaña en Chrome
            retry: 1, // Si falla la red, reintenta 1 vez silenciosamente
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 💡 Las Devtools son una maravilla visual. Solo aparecerán en tu entorno local (desarrollo) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}