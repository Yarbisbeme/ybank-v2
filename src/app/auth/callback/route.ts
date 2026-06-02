import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/createServerClient'; // Ajusta la ruta a tu cliente

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createSupabaseClient();
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const session = data.session;
      const user = session.user;

      // 2. 🧠 INTERCEPTOR OAUTH: Extraemos los tokens de Google si existen
      if (session.provider_token) {
        const expiresIn = (session as any).provider_token_expires_in || 3600;
        const expirationDate = new Date(Date.now() + expiresIn * 1000).toISOString();

        const { error: dbError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id, // Requerido para saber qué fila insertar/mapear
            google_access_token: session.provider_token,
            ...(session.provider_refresh_token && { google_refresh_token: session.provider_refresh_token }),
            google_token_expires_at: expirationDate,
            updated_at: new Date().toISOString()
          });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (!profile?.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}