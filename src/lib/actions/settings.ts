'use server'

import { createSupabaseClient } from '../supabase/createServerClient';

export async function updatePreferences(formData: { password?: string; currency?: string }) {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autorizado" };

  // 1. Actualizar Contraseña (Solo si el usuario escribió algo)
  if (formData.password && formData.password.trim() !== '') {
    if (formData.password.length < 6) {
      return { success: false, error: "La contraseña debe tener al menos 6 caracteres" };
    }
    const { error: pwdError } = await supabase.auth.updateUser({
      password: formData.password
    });
    if (pwdError) return { success: false, error: `Error de seguridad: ${pwdError.message}` };
  }

  // 2. Actualizar Moneda (Solo si se seleccionó)
  if (formData.currency) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ currency_preference: formData.currency, updated_at: new Date().toISOString() })
      .eq('id', user.id);
      
    if (profileError) return { success: false, error: `Error en perfil: ${profileError.message}` };
  }

  return { success: true };
}