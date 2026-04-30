import AccountDetailsHeader from '@/components/accounts/AccountDetailsHeader';
import AccountStageSelector from '@/components/accounts/AccountStageSelector';
import PageFilterBar from '@/components/Transactions/PageFilterBar';
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper';
// 💡 Asegúrate de importar el componente de tu modal de cuentas

import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';
import { TransactionFilters as FilterType } from '@/types/database.types';
import TransactionTable from '@/components/Transactions/RecentActivityTable';
import { Zap } from 'lucide-react'; 
import AccountFormWrapper from '@/components/accounts/AccountFormWrapper';

export default async function AccountsPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  
  const searchParams = await props.searchParams;
  
  // 💡 1. Variable para el modal de Transacciones (El botón "Add")
  const isTransactionModalOpen = searchParams.newTx === 'true' || !!searchParams.editTx;
  
  // 💡 2. Variable para el modal de Cuentas (El botón "Edit")
  const isAccountModalOpen = !!searchParams.editAccountId;
  
  const accountId = searchParams.accountId;

  const [accounts, categoriesTree, tags] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTags()
  ]);

  const flatCategories = categoriesTree.flatMap(c => [c, ...(c.subcategories || [])]);
  const selectedAccount = accountId ? (accounts.find(a => a.id === accountId) || accounts[0]) : accounts[0];

  const currentFilters: FilterType = {
    type: (searchParams.type as FilterType['type']) || null,
    categoryId: searchParams.categoryId || null,
    tagId: searchParams.tagId || null,
    accountId: selectedAccount.id, 
    startDate: searchParams.startDate || null,
    endDate: searchParams.endDate || null,
  };

  const { transactions } = await getTransactions({ 
    accountId: selectedAccount.id,
    filters: currentFilters
  });

  return (
    <div className="max-w-[1400px] mx-auto sm:px-4 md:px-8 sm:py-6 space-y-8 sm:pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4  hidden sm:block">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-muted-foreground" />
          <h1 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Control de Nodos
          </h1>
        </div>
      </div>

      <section>
        <AccountStageSelector accounts={accounts} activeId={selectedAccount.id} />
      </section>

      <section>
        <AccountDetailsHeader account={selectedAccount} />
      </section>

      <section className="pt-8">
        <div className="flex items-center gap-2 mb-6">
           <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
             Registro de Operaciones
           </h2>
           <span className="px-2 py-0.5 rounded-[4px] bg-surface-2 border border-border text-[9px] font-mono font-bold text-foreground">
             {transactions.length}
           </span>
        </div>
        
        <TransactionTable transactions={transactions} />
      </section>

      {/* 💡 Renderizado condicional independiente para cada modal */}
      {isTransactionModalOpen && ( <TransactionModalWrapper /> )}
    </div>
  );
}