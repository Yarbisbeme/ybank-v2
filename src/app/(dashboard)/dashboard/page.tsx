import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';

import NetWorthCard from '@/components/dashboard/NetWorth/NetWorthCard';
import FinancialHealthCard from '@/components/dashboard/FinancialHealthCard';
import { TransactionFilters as FilterType } from '@/types/database.types';
import ActivitySection from '@/components/Transactions/ActivitySection';
import AccountCarousel from '@/components/accounts/AccountCarousel';
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper';

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  
  const resolvedSearchParams = await props.searchParams;

  const currentFilters: FilterType = {
    type: (resolvedSearchParams.type as FilterType['type']) || null,
    categoryId: (resolvedSearchParams.categoryId as string) || null,
    tagId: (resolvedSearchParams.tagId as string) || null,
    accountId: (resolvedSearchParams.accountId as string) || null,
    startDate: (resolvedSearchParams.startDate as string) || null,
    endDate: (resolvedSearchParams.endDate as string) || null,
  };

  // 💡 1. Leemos de la URL si el usuario quiere abrir el modal
  const showNewTxModal = resolvedSearchParams.newTx === 'true';
  const editTxId = resolvedSearchParams.editTx as string | undefined;
  
  // 💡 2. Evaluamos si el modal DEBE estar abierto
  const isModalOpen = showNewTxModal || !!editTxId;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        
        {/* Tarjeta 1: NetWorth */}
        <div className="w-full md:col-span-2"> 
          <NetWorthCard accounts={accounts} transactions={transactions} />
        </div>

        {/* Tarjeta 2: FinancialHealth */}
        <div className="w-full">
          <FinancialHealthCard accounts={accounts} />
        </div>
        
      </div>
    </div>

      {/* SECCIÓN CUENTAS */}
      <div className="flex flex-col mt-4 md:mt-6">
        {/* 💡 El nuevo título con el mismo estilo pesado (font-black) de tu app */}
        <div className="flex justify-between items-end mb-3 px-2 md:px-0 sm:hidden">
          <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
            Tus Cuentas
          </h2>
          {/* Opcional: Si en el futuro quieres poner un contador o un botón */}
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
            {accounts.length}
          </span>
        </div>

        {/* El carrusel de siempre (mantiene el margen negativo para que deslice hasta el borde en móvil) */}
        <div className="-mx-4 md:mx-0"> 
          <AccountCarousel accounts={accounts}/>
        </div>
      </div>

      {/* SECCIÓN DE ACTIVIDAD */}
      <div className="w-full pb-20 md:pb-0"> 
         <ActivitySection 
           transactions={transactions}
           initialFilters={currentFilters}
           categories={flatCategories}
           tags={tags}
           accounts={accounts}
         />
      </div>

      {/* 💡 3. RENDERIZADO CONDICIONAL: Solo existe si la URL lo pide */}
      {isModalOpen && (
        <TransactionModalWrapper editTxId={editTxId} />
      )}
      
    </div>
  );
}