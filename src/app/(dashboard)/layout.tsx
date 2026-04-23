import { Suspense } from 'react';
import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import Navbar from "@/components/layout/Navbar/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import TransactionModal from '@/components/Transactions/TransactionModal';
import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getTags } from '@/lib/actions/tags';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Verificación de sesión
  if (!user) {
    redirect('/sign-in');
  }

  // 🛡️ 2. EL PORTERO GLOBAL: Verificamos el perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  // 🛡️ Ahora la condición es infalible: si no ha completado el proceso, fuera.
  if (!profile || profile.onboarding_completed === false) {
    redirect('/onboarding');
  }

  // 3. Carga de datos pesados (SOLO si pasó la seguridad)
  const [accounts, transactionsData, tags] = await Promise.all([
    getAccounts(),
    getTransactions({}),
    getTags()
  ]);

  const navbarUser = {
    name: user.user_metadata?.full_name || user.email || 'Usuario',
    role: 'Administrador', // Puedes poner el rol que prefieras o sacarlo de la base de datos
    avatarUrl: user.user_metadata?.avatar_url
  };
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r bg-white z-50">
        <Sidebar />
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col">
        <Navbar 
          user={navbarUser} 
          accounts={accounts} 
          transactions={transactionsData.transactions} 
          tags={tags} 
        />
        <main className="p-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto w-full scrollbar-hide overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}