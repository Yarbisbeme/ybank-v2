import { Suspense } from 'react'; // 💡 1. Importamos Suspense
import { createSupabaseClient } from '@/lib/supabase/createServerClient'
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import TransactionModal from '@/components/Transactions/TransactionModal';
import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getTags } from '@/lib/actions/tags';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {

  // Obtenemos la sesión del usuario
  const [accounts, transactionsData, tags] = await Promise.all([
    getAccounts(),
    getTransactions({}),
    getTags()
  ]);

  const user = { name: "Yarbis Beltre", role: "Dev & QA", avatarUrl: "..." };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r bg-white z-50">
        <Sidebar />
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col">
        <Navbar 
          user={user} 
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
};