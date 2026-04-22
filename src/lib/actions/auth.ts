'use server'

import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function signInWithGoogle() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Silent error
          }
        }
      }
    }
  );

  // === LÓGICA DINÁMICA DE URL ===
  // 1. Si definiste NEXT_PUBLIC_SITE_URL en Vercel (Tu dominio final), usa ese.
  // 2. Si no, usa VERCEL_URL (URL automática que genera Vercel en cada deploy), agregándole https://.
  // 3. Si no hay nada (estás en tu PC), usa localhost.
  const getURL = () => {
    let url =
      process.env.NEXT_PUBLIC_SITE_URL ?? // Pon esto en tus variables de Vercel
      process.env.VERCEL_URL ?? // Vercel lo pone solo automáticamente
      'http://localhost:3000/'

    // Asegurarse de incluir `https://` si no es localhost
    url = url.includes('http') ? url : `https://${url}`
    // Asegurarse de que no termine en '/' para evitar dobles slashes
    url = url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url
    return url
  }

  const origin = getURL(); 
  // ==============================

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`, // Ahora esto es dinámico
      
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      scopes: 'https://www.googleapis.com/auth/gmail.readonly',
    },
  });

  if (error) {
    console.error('Error iniciando OAuth:', error);
    return redirect('/sign-in?error=oauth_start_error');
  }

  if (data.url) {
    return redirect(data.url);
  }
}