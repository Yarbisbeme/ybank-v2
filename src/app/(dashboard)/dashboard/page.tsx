import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';

import NetWorthCard from '@/components/dashboard/NetWorth/NetWorthCard';
import FinancialHealthCard from '@/components/dashboard/FinancialHealthCard';
import { TransactionFilters as FilterType } from '@/types/database.types';
import ActivitySection from '@/components/Transactions/ActivitySection';
import AccountCarousel from '@/components/accounts/AccountCarousel';

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
  <div className="max-w-[1600px] mx-auto px-1 md:px-8 py-4 space-y-4 md:space-y-10">
    <div className='flex flex-col'>
        
        {/* Cambiamos a grid-cols-2 para que midan lo mismo (50/50) en escritorio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        
        {/* Tarjeta 1: NetWorth */}
        <div className="w-full">
          <NetWorthCard accounts={accounts} transactions={transactions} />
        </div>

        {/* Tarjeta 2: FinancialHealth */}
        <div className="w-full">
          <FinancialHealthCard accounts={accounts} />
        </div>
        
      </div>
    </div>

      {/* SECCIÓN CUENTAS */}
      {/* El carrusel ya debería manejar su propio scroll, pero bajamos el margen */}
      <div className="-mx-4 md:mx-0"> 
        <AccountCarousel accounts={accounts}/>
      </div>

      {/* SECCIÓN DE ACTIVIDAD */}
      <div className="w-full pb-20 md:pb-0"> {/* Padding bottom para que el menú móvil no tape la tabla */}
         <ActivitySection 
           transactions={transactions}
           initialFilters={currentFilters}
           categories={flatCategories}
           tags={tags}
           accounts={accounts}
         />
      </div>
    </div>
  );
}