'use client' // 💡 Esta es la línea clave

import { ThemeProvider as NextThemesProvider } from '@teispace/next-themes'

export function ThemeProvider({ children, ...props }: any) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}