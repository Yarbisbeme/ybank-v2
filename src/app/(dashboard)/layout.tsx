import Navbar from "@/components/layout/Navbar/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getTags } from '@/lib/actions/tags';
import { getCategories } from '@/lib/actions/categories';
import { getInstitutions } from '@/lib/actions/institutions';

import DashboardProviders from '@/components/providers/DashboardProviders';
import PWAFooter from '@/components/layout/PWAFooter';
import { createSupabaseClient } from '@/lib/supabase/createServerClient'

interface DashboardInitialData {
  accounts: any[];
  tags: any[];
  categories: any[];
  institutions: any[];
  transactions: any[];
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseClient();
  
  // 1. Auth Blindado
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    // Si falla el fetch a Supabase, confiamos en el Middleware. 
    // No redirigimos aquí para evitar el bucle offline.
    console.log("📡 Layout: Fallo de red en Auth, permitiendo renderizado de shell.");
  }

  // 🚨 Solo redirigir si estamos SEGUROS de que no hay usuario Y hay red
  // En localhost/offline, es mejor dejar que el cliente maneje la sesión.
  if (!user && process.env.NODE_ENV === 'production') {
    // Opcional: podrías chequear la cookie aquí también si quieres ser extra estricto
  }

  // 2. Datos Iniciales con Fallback
  let profile = { onboarding_completed: true, primary_account_id: null };
  let initialData: DashboardInitialData = { 
    accounts: [], 
    tags: [], 
    categories: [], 
    institutions: [], 
    transactions: [] 
  };

  try {
    // Intentamos traer el perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('onboarding_completed, primary_account_id')
      .single();
    
    if (profileData) profile = profileData as any;

    // Intentamos la hidratación masiva
    const [accounts, txData, tags, categoriesTree, institutions] = await Promise.all([
      getAccounts(),
      getTransactions({}),
      getTags(),
      getCategories(),
      getInstitutions()
    ]);

    initialData = {
      accounts,
      tags,
      categories: categoriesTree,
      institutions,
      transactions: txData.transactions
    };
  } catch (error) {
    console.warn("📡 Layout: Modo Offline. Se enviará un initialData vacío.");
  }

  const navbarUser = {
    name: user?.user_metadata?.full_name || user?.email || 'Usuario',
    email: user?.email || '',
    avatarUrl: user?.user_metadata?.avatar_url
  };

  return (
    <DashboardProviders 
      initialData={initialData}
      primaryAccountId={profile.primary_account_id}
      institutionId={null}
    >
      <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
        
        {/* BARRA LATERAL (DESKTOP) */}
        <aside className="hidden lg:flex w-64 flex-col flex-none border-r border-border bg-card">
          <Sidebar />
        </aside>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          <Navbar 
            user={navbarUser} 
            accounts={initialData.accounts} 
            transactions={initialData.transactions} 
            tags={initialData.tags} 
            categories={initialData.categories}
          />
          
          <main className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden md:pt-6 md:pb-0 scrollbar-hide">
            
            <div className="grow max-w-[1400px] mx-auto w-full px-4">
              {children}
            </div>
            <PWAFooter />
          </main>
        </div>
      </div>
    </DashboardProviders>
  );

}