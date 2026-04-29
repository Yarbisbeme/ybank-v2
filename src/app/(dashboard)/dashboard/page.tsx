import { getAccounts, calculateNormalizedTotal } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';

// 💡 1. Importamos el nuevo componente
import FinancialHealthCard from '@/components/dashboard/FinancialHealthCard';
import ActivitySection from '@/components/Transactions/ActivitySection';
import AccountCarousel from '@/components/accounts/AccountCarousel';
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper';
import { TransactionFilters as FilterType } from '@/types/database.types';
import HeroBalance from '@/components/dashboard/NetWorth/HeroBalance';

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

  const showNewTxModal = resolvedSearchParams.newTx === 'true';
  const editTxId = resolvedSearchParams.editTx as string | undefined;
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

  // 💡 2. INGENIERÍA DE DATOS: Separamos el capital líquido de la deuda
  // Asumiendo que 'credit_card' (o 'loan') son tus tipos de deuda
  const liquidAccounts = accounts.filter(a => a.type !== 'credit_card');
  const debtAccounts = accounts.filter(a => a.type === 'credit_card');

  // 💡 3. NORMALIZACIÓN: Calculamos los totales en DOP desde el servidor
  const [baseLiquidDOP, baseDebtDOP] = await Promise.all([
    calculateNormalizedTotal(liquidAccounts),
    calculateNormalizedTotal(debtAccounts)
  ]);

  return (
  <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-8 md:space-y-12">
    
    {/* SECCIÓN PRINCIPAL: HERO & HEALTH */}
    <div className="flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Tarjeta 1: Hero Balance (Reemplaza NetWorth) */}
        <div className="w-full lg:col-span-2"> 
          <HeroBalance 
            accounts={accounts}
            transactions={transactions}
            baseLiquidDOP={baseLiquidDOP}
            baseDebtDOP={baseDebtDOP}
          />
        </div>

        {/* Tarjeta 2: FinancialHealth */}
        <div className="w-full">
          <FinancialHealthCard accounts={accounts} />
        </div>
        
      </div>
    </div>

      {/* SECCIÓN CUENTAS */}
      <div className="flex flex-col">
        <div className="flex justify-between items-end mb-4 px-1 md:px-0 sm:hidden">
          <h2 className="text-xl md:text-2xl font-bold text-foreground font-sans tracking-tight">
            Nodos Activos
          </h2>
          <span className="text-xs font-mono font-bold text-muted-foreground bg-surface-2 border border-border px-2 py-1 rounded-md">
            {accounts.length}
          </span>
        </div>

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

      {/* RENDERIZADO CONDICIONAL DEL MODAL */}
      {isModalOpen && (
        <TransactionModalWrapper editTxId={editTxId} />
      )}
      
    </div>
  );
}