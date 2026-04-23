// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (err) {}
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 🔍 VERIFICACIÓN DE SEGURIDAD
      const { data: { user } } = await supabase.auth.getUser();
      
      // Consultamos si ya tiene un perfil con moneda configurada
      const { data: profile } = await supabase
        .from('profiles')
        .select('currency_preference')
        .single();

      // LOGICA: Si no tiene moneda, asumimos que no terminó el onboarding
      // por lo tanto, no ha creado su contraseña de YBank.
      if (!profile?.currency_preference) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_code_error`);
}