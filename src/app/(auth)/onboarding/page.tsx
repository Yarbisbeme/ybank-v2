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

    const hasName = !!user?.user_metadata?.full_name;
    const institutions = await getInstitutions();
    const needsPassword = !user?.app_metadata?.providers?.includes('email');

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 transition-colors">
      <div className="mb-8">
        <Logo />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-foreground tracking-tight">Personaliza tu experiencia</h1>
          <p className="text-muted-foreground font-medium mt-2">Solo tomará un minuto configurar tu YBank.</p>
        </div>

        <OnboardingForm 
            initialStep={!hasName ? 1 : needsPassword ? 2 : 3} 
            defaultName={user?.user_metadata?.full_name || ""}
            institutions={institutions}
        />
      </div>
    </main>
  );
}