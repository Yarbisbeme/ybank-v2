// src/app/onboarding/page.tsx
import OnboardingForm from "@/components/dashboard/OnboardingForm";
import { Logo } from "@/components/ui/Logo";
import { getInstitutions } from "@/lib/actions/institutions";
import { createSupabaseClient } from "@/lib/supabase/createServerClient";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/sign-in');
    }

    // 🔍 ANALISIS DE QA: ¿Qué nos falta saber?
    // 1. ¿Tiene nombre? (Si se registró por Email ya lo pedimos, si es Google viene en la metadata)
    const hasName = !!user?.user_metadata?.full_name;
    const institutions = await getInstitutions();
    // 2. ¿Necesita configurar contraseña? 
    // Solo si entró por Google y queremos que tenga una clave local, 
    // O si quieres que todos pasen por este paso por seguridad.
    const needsPassword = !user?.app_metadata?.providers?.includes('email');

  return (
    <main className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">Personaliza tu experiencia</h1>
          <p className="text-slate-500 font-medium mt-2">Solo tomará un minuto configurar tu YBank.</p>
        </div>

        {/* Pasamos los flags para que el formulario sepa qué pasos mostrar */}
        <OnboardingForm 
            initialStep={!hasName ? 1 : needsPassword ? 2 : 3} 
            defaultName={user?.user_metadata?.full_name || ""}
            institutions={institutions}
        />
      </div>
    </main>
  );
}