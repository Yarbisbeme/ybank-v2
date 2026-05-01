import AccountDetailsHeader from '@/components/accounts/AccountDetailsHeader';
import AccountStageSelector from '@/components/accounts/AccountStageSelector';
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper';

import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';
import { TransactionFilters as FilterType } from '@/types/database.types';
import TransactionTable from '@/components/Transactions/RecentActivityTable';
import { Zap } from 'lucide-react'; 
import ModalProvider from '@/components/providers/ModalProvider';
import { getInstitutions } from '@/lib/actions/institutions';

export default async function AccountsPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  
  const searchParams = await props.searchParams;
  const accountId = searchParams.accountId;

  const [accounts, categoriesTree, tags, institutions] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTags(),
    getInstitutions()
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
    </div>
  );
}