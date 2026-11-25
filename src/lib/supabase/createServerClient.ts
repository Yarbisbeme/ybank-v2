'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { publicEnv } from '@/shared/config/env'

export async function createSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { 
      cookies: { 
        getAll() { 
          return cookieStore.getAll() 
        }, 
        // 💡 CLAVE: Permitimos que las Server Actions guarden las cookies de autenticación
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          } catch {
            // El Middleware se encargará de refrescar/escribir si esta función 
            // es llamada desde un Server Component de solo lectura.
          }
        } 
      } 
    }
  )  
}