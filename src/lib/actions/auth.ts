'use server'

import { redirect } from 'next/navigation';
import { createSupabaseClient } from '../supabase/createServerClient';

/**
 * 📝 REGISTRO CON EMAIL
 * Crea el usuario en auth.users y dispara el flujo de onboarding.
 */
export async function signUpWithEmail({ email, password, fullName }: any) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true, user: JSON.parse(JSON.stringify(data.user)) }
}

//🔐 LOGIN CON EMAIL Y CONTRASEÑA
export async function loginWithEmail({ email, password }: any) {
  const supabase = await createSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

//🌐 SIGN IN CON GOOGLE (OAuth con Scopes de Gmail)
export async function signInWithGoogle() {
  const supabase = await createSupabaseClient();

  const getURL = () => {
    if (process.env.NODE_ENV === 'production') {
      return 'https://ybank-v2.vercel.app';
    }
    return 'http://localhost:3000';
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getURL()}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      scopes: 'https://www.googleapis.com/auth/gmail.modify',
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
  const supabase = await createSupabaseClient();
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
    return { success: false, error: "Los usuarios de Google deben establecer una contraseña." };
  }

  const { data: profileData, error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: formData.fullName,
    currency_preference: formData.currency,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
    primary_account_id: formData.primaryAccountId,
  })
  .select('*') // 💡 Pedimos el perfil completo
  .single();

  if (profileError) return { success: false, error: profileError.message };

  return { success: true, data: profileData }; 
}

export async function signOut() {
  const supabase = await createSupabaseClient();

  // Cerramos sesión en Supabase
  await supabase.auth.signOut();
  
  // Redirigimos al usuario a la pantalla de login
  redirect('/sign-in'); 
}