
import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import Navbar from "@/components/layout/Navbar/Navbar";
import Sidebar from "@/components/layout/Sidebar";
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
    email: user.email!,
    avatarUrl: user.user_metadata?.avatar_url
  };
  return (
    /* 💡 FIX: h-screen + overflow-hidden evita que el BODY haga scroll */
    <div className="flex h-screen w-full bg-[#F8F9FB] overflow-hidden">
      
      {/* 💡 SIDEBAR: Fijo para escritorio */}
      <aside className="hidden lg:flex w-64 flex-col flex-none border-r border-slate-100 bg-white">
        <Sidebar />
      </aside>

      {/* 💡 CONTENEDOR DERECHO: Ocupa el resto del espacio */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        
        {/* El Navbar se queda arriba. Al estar fuera del scroll del main, 
            el menú móvil que vive dentro del Navbar se posicionará relativo 
            a la pantalla, no al contenido largo. */}
        <Navbar 
          user={navbarUser} 
          accounts={accounts} 
          transactions={transactionsData.transactions} 
          tags={tags} 
        />
        
        {/* 💡 MAIN: Este es el ÚNICO lugar donde se permite el scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:px-8 lg:px-12 scrollbar-hide">
          <div className="max-w-[1600px] mx-auto w-full pb-20">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}