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
          // CORRECCIÓN: Ahora sí guardamos las cookies (el PKCE verifier)
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Este catch es por seguridad, pero en una Server Action esto funcionará bien.
          }
        }
      }
    }
  );

  // Mantenemos tu URL hardcodeada que sabemos que funciona
  const origin = 'http://localhost:3000'; 

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      
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