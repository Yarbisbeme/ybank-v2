import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  // Retorna el cliente configurado con las variables de entorno
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Método para obtener todas las cookies (necesario para Auth)
        getAll() {
          return cookieStore.getAll()
        },
        // Método para guardar cookies (necesario al iniciar sesión o refrescar token)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // El método setAll fue llamado desde un Server Component.
            // Esto puede ignorarse si tienes un Middleware refrescando las sesiones.
          }
        },
      },
    }
  )
}