// src/app/settings/page.tsx
import SettingsForm from "@/components/dashboard/SettingsForm";
import { createSupabaseClient } from "@/lib/supabase/createServerClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  // Obtenemos la moneda actual para que el select no aparezca en blanco
  const { data: profile } = await supabase
    .from('profiles')
    .select('currency_preference')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Ajustes</h1>
        <p className="text-slate-500 font-medium mt-2">Gestiona tu seguridad y preferencias de cuenta.</p>
      </div>

      <SettingsForm currentCurrency={profile?.currency_preference || 'DOP'} />
    </div>
  );
}