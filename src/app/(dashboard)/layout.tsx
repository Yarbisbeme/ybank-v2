import { Suspense } from 'react'; // 💡 1. Importamos Suspense
import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import TransactionModal from '@/components/Transactions/TransactionModal';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Iniciamos el cliente de Supabase
  const supabase = await createSupabaseClient();
  
  // Obtenemos la sesión del usuario
  const { data: { session } } = await supabase.auth.getSession();

  // Formateamos la data para el Navbar
  const userData = session ? {
    name: session.user.user_metadata?.full_name || 'Usuario',
    avatarUrl: session.user.user_metadata?.avatar_url || '', 
    role: 'Dev & QA Analyst' 
  } : undefined;

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r bg-white z-50">
        <Sidebar />
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col">
        <Navbar user={userData}/>
        <main className="p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
        
      </div>
    </div>
  );
};