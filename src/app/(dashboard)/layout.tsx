import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import Navbar from "@/components/layout/Navbar/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getTags } from '@/lib/actions/tags';
import { redirect } from 'next/navigation';
// Importamos un nuevo componente que crearemos para sincronizar el Store
import StoreInitializer from '@/components/providers/StoreInitializer';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      onboarding_completed, 
      primary_account_id,
      accounts ( institution_id ) 
    `) // 💡 Usamos las relaciones de Supabase para traer el institution_id
    .eq('id', user.id)
    .single();

  if (!profile || profile.onboarding_completed === false) {
    redirect('/onboarding');
  }

  // 3. Carga paralela de alta velocidad
  const [accounts, transactionsData, tags] = await Promise.all([
    getAccounts(),
    getTransactions({}),
    getTags()
  ]);

  const navbarUser = {
    name: user.user_metadata?.full_name || user.email || 'Usuario',
    email: user.email!,
    avatarUrl: user.user_metadata?.avatar_url
  };

  const institutionId = (profile.accounts as any)?.institution_id || null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      
      <StoreInitializer 
        primaryAccountId={profile.primary_account_id} 
        institutionId={institutionId} 
      />

      <aside className="hidden lg:flex w-64 flex-col flex-none border-r border-border bg-card">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Navbar 
          user={navbarUser} 
          accounts={accounts} 
          transactions={transactionsData.transactions} 
          tags={tags} 
        />
        
        {/* Usamos el max-width que definiste pero con un toque más de aire */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 scrollbar-hide">
          <div className="max-w-[1400px] mx-auto w-full pb-24">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}