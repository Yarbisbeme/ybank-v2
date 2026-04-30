import { getAccounts, calculateNormalizedTotal } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';

import FinancialHealthCard from '@/components/dashboard/FinancialHealthCard';
import ActivitySection from '@/components/Transactions/ActivitySection';
import AccountCarousel from '@/components/accounts/AccountCarousel';
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper';
import { TransactionFilters as FilterType } from '@/types/database.types';
import HeroBalance from '@/components/dashboard/NetWorth/HeroBalance';
// 💡 1. Importamos nuestro nuevo Bento de Crédito
import CreditHealthBento from '@/components/dashboard/CreditHealthBento'; 

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
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 md:space-y-8">
      
      {/* 💡 BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto">
        
        {/* =========================================
            FILA 1
        ============================================= */}
        {/* BLOQUE PRINCIPAL - Hero Balance (8 Columnas) */}
        <div className="md:col-span-12 lg:col-span-8"> 
          <HeroBalance 
            accounts={accounts}
            transactions={transactions}
            baseLiquidDOP={baseLiquidDOP}
            baseDebtDOP={baseDebtDOP}
          />
        </div>

        {/* BLOQUE SECUNDARIO - Financial Health (4 Columnas) */}
        <div className="md:col-span-12 lg:col-span-4">
          <CreditHealthBento accounts={accounts} />
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <TransactionModalWrapper editTxId={editTxId} />
      )}
      
    </div>
  );
}