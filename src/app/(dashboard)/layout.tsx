'use server'

import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import { cookies } from 'next/headers';
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

// Definimos el componente como una constante primero
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // 1. Iniciamos el cliente de Supabase en el servidor
  const supabase = await createSupabaseClient();
  
  // 2. Obtenemos la sesión del usuario
  const { data: { session } } = await supabase.auth.getSession();

  // 3. Formateamos la data para el Navbar
  const userData = session ? {
    name: session.user.user_metadata?.full_name || 'Usuario',
    // La imagen de Google viene en avatar_url
    avatarUrl: session.user.user_metadata?.avatar_url || '', 
    // Supabase no guarda "roles" por defecto, puedes quemar este o traerlo de una tabla 'users'
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
