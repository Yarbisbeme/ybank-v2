import { redirect } from 'next/navigation';
import { getInstitutions } from '@/lib/actions/institutions';
import { createSupabaseClient } from '@/lib/supabase/createServerClient';
import { YMark } from '@/components/atoms';
import OnboardingForm from '@/components/dashboard/OnboardingForm';

export default async function OnboardingPage() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const hasName = Boolean(user?.user_metadata?.full_name);
  const institutions = await getInstitutions();
  const needsPassword = !user?.app_metadata?.providers?.includes('email');

  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <YMark lockup size={28} />
      </div>

      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1.5">
          <h1 className="title-l text-ink">Configura tu cuenta</h1>
          <p className="body text-ink-2">
            Solo tomará un minuto dejar YBank listo.
          </p>
        </div>

        <OnboardingForm
          initialStep={!hasName ? 1 : needsPassword ? 2 : 3}
          defaultName={
            typeof user?.user_metadata?.full_name === 'string'
              ? user.user_metadata.full_name
              : ''
          }
          institutions={institutions}
        />
      </div>
    </main>
  );
}
