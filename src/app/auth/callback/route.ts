import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // 1. Capturamos el "code" que nos manda Google en la URL
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // "next" es a donde queremos ir después (por defecto /dashboard)
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    
    // 2. Intercambiamos ese código por una sesión real de usuario
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 3. Si todo salió bien, mandamos al usuario al Dashboard
      // IMPORTANTE: Usamos redirect absoluto para limpiar la URL
      return NextResponse.redirect(`${origin}${next}`);
    } else {
        console.error('Error Auth Callback:', error);
    }
  }

  // Si algo falló, lo devolvemos al login
  return NextResponse.redirect(`${origin}/sign-in?error=auth_code_error`);
}