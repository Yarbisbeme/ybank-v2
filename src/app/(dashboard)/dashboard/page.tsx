import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';

import NetWorthCard from '@/components/dashboard/NetWorth/NetWorthCard';
import FinancialHealthCard from '@/components/dashboard/FinancialHealthCard';
import RecentActivityTable from '@/components/dashboard/RecentActivityTable';
import AccountCarousel from '@/components/dashboard/AccountCarousel';
import { TransactionFilters as FilterType } from '@/types/database.types';
import TransactionFiltersWrapper from '@/components/Transactions/TransactionFiltersWrapper';

// 💡 1. Actualizamos la firma para indicar que searchParams es una Promesa
export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  
  // 💡 2. ¡ESPERAMOS los searchParams antes de usarlos!
  const resolvedSearchParams = await props.searchParams;

  // 💡 3. Usamos resolvedSearchParams en lugar del searchParams original
  const currentFilters: FilterType = {
    type: (resolvedSearchParams.type as FilterType['type']) || null,
    categoryId: (resolvedSearchParams.categoryId as string) || null,
    tagId: (resolvedSearchParams.tagId as string) || null,
    accountId: (resolvedSearchParams.accountId as string) || null,
    startDate: (resolvedSearchParams.startDate as string) || null,
    endDate: (resolvedSearchParams.endDate as string) || null,
  };

  // Obtenemos datos concurrentemente
  const [accounts, categoriesTree, tags] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTags()
  ]);

  const flatCategories = categoriesTree.flatMap(c => [c, ...(c.subcategories || [])]);

  // Obtenemos las transacciones
  const { transactions } = await getTransactions({ 
    pageSize: 20,
    accountId: currentFilters.accountId || undefined, 
    filters: currentFilters 
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <NetWorthCard accounts={accounts} transactions={transactions} />
        </div>
        <div>
          <FinancialHealthCard accounts={accounts} />
        </div>
      </div>

      <AccountCarousel accounts={accounts} />

      <div className="w-full">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h3>
            
            <TransactionFiltersWrapper 
              initialFilters={currentFilters}
              categories={flatCategories}
              tags={tags}
              accounts={accounts}
            />
         </div>
         
         <RecentActivityTable transactions={transactions} />
      </div>
    </div>
  );
}