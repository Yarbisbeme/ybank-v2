import { getAccounts, calculateNormalizedTotal } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';

// Componentes
import HeroBalance from '@/components/dashboard/NetWorth/HeroBalance';
import CreditHealthBento from '@/components/dashboard/CreditHealthBento'; 
import AccountCarousel from '@/components/accounts/AccountCarousel';
import ActivitySection from '@/components/Transactions/ActivitySection';
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper';
import { TransactionFilters as FilterType } from '@/types/database.types';

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

  const liquidAccounts = accounts.filter(a => a.type !== 'credit_card');
  const debtAccounts = accounts.filter(a => a.type === 'credit_card');

  const [baseLiquidDOP, baseDebtDOP] = await Promise.all([
    calculateNormalizedTotal(liquidAccounts),
    calculateNormalizedTotal(debtAccounts)
  ]);

  return (
    // 💡 Aumentamos un poco el espaciado vertical (space-y-8) para que respire
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-8 md:space-y-10">
      
      {/* =========================================
          FILA 1: MACRO INDICADORES (Bento Grid)
      ============================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto">
        
        {/* BLOQUE PRINCIPAL - Hero Balance (8 Columnas) */}
        <div className="md:col-span-12 lg:col-span-8"> 
          <HeroBalance 
            accounts={accounts}
            transactions={transactions}
            baseLiquidDOP={baseLiquidDOP}
            baseDebtDOP={baseDebtDOP}
          />
        </div>

        {/* BLOQUE SECUNDARIO - Score Shield (4 Columnas) */}
        <div className="md:col-span-12 lg:col-span-4">
          <CreditHealthBento accounts={accounts} />
        </div>
      </div>

      {/* =========================================
          FILA 2: MICRO INDICADORES (Nodos)
      ============================================= */}
      {/* Fuera del grid para que aproveche todo el ancho en el scroll horizontal */}
      <div>
        <AccountCarousel accounts={accounts} />
      </div>

      {/* =========================================
          FILA 3: OPERATIVA (Transacciones)
      ============================================= */}
      <div className="pb-20 md:pb-0">
        <ActivitySection 
          transactions={transactions}
          initialFilters={currentFilters}
          categories={flatCategories}
          tags={tags}
          accounts={accounts}
        />
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <TransactionModalWrapper editTxId={editTxId} />
      )}
      
    </div>
  );
}