'use server'

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * 🛠️ HELPER: Crea el cliente de Supabase con persistencia de cookies
 */
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Silent error */ }
        }
      }
    }
  );
}

/**
 * 📝 REGISTRO CON EMAIL
 * Crea el usuario en auth.users y dispara el flujo de onboarding.
 */
export async function signUpWithEmail({ email, password, fullName }: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      // Redirige al callback para procesar la sesión después de confirmar email
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true, user: data.user };
}

/**
 * 🔐 LOGIN CON EMAIL Y CONTRASEÑA
 */
export async function loginWithEmail({ email, password }: any) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * 🌐 SIGN IN CON GOOGLE (OAuth con Scopes de Gmail)
 */
export async function signInWithGoogle() {
  const supabase = await getSupabaseClient();

  const getURL = () => {
    let url = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL ?? 'http://localhost:3000/';
    url = url.includes('http') ? url : `https://${url}`;
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getURL()}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      // 💡 Importante para YBank: Pedimos permiso para leer correos bancarios
      scopes: 'https://www.googleapis.com/auth/gmail.readonly',
    },
  });

  if (error) return redirect('/sign-in?error=oauth_start_error');
  if (data.url) return redirect(data.url);
}

export async function completeOnboarding(formData: {
  fullName: string;
  password?: string;
  currency: string;
  primaryAccountId?: string;
}) {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sesión no encontrada" };

  // 1. Verificamos cómo se logueó el usuario
  const isGoogleUser = user.app_metadata?.provider === 'google';

  // 2. 🔐 LÓGICA DE CONTRASEÑA (Mejorada)
  if (formData.password && formData.password.length > 0) {
    if (formData.password.length < 6) {
      return { success: false, error: "La contraseña debe tener al menos 6 caracteres" };
    }

    const { error: pwdError } = await supabase.auth.updateUser({
      password: formData.password
    });

    if (pwdError) {
      return { success: false, error: `Error de seguridad: ${pwdError.message}` };
    }
  } else if (isGoogleUser) {
    // 💡 Solo obligamos a poner contraseña si viene de Google
    return { success: false, error: "Los usuarios de Google deben establecer una contraseña." };
  }

  // 3. 📝 ACTUALIZACIÓN DE PERFIL (Ahora sí llegará aquí)
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: formData.fullName,
    currency_preference: formData.currency,
    onboarding_completed: true, // 👈 ¡ESTO ES LA LLAVE!
    updated_at: new Date().toISOString(),
    primary_account_id:formData.primaryAccountId,
  });

  if (profileError) return { success: false, error: profileError.message };

  return { success: true };
}

export async function signOut() {
  const supabase = await getSupabaseClient();

  // Cerramos sesión en Supabase
  await supabase.auth.signOut();
  
  // Redirigimos al usuario a la pantalla de login
  redirect('/sign-in'); 
}