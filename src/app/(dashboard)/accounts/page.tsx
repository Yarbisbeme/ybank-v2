import AccountDetailsHeader from '@/components/accounts/AccountDetailsHeader';
import AccountStageSelector from '@/components/accounts/AccountStageSelector';
import TransactionTable from '@/components/dashboard/RecentActivityTable';
import PageFilterBar from '@/components/Transactions/PageFilterBar';
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper';
import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';
import { TransactionFilters as FilterType } from '@/types/database.types';
import AccountModalWrapper from '@/components/accounts/AccountModalWrapper';

export default async function AccountsPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  
  const searchParams = await props.searchParams;
  const isTxModalOpen = searchParams.newTx === 'true' || !!searchParams.editTx;
  // 💡 Aseguramos de leer el parámetro correcto para abrir el modal
  const isAccountModalOpen = searchParams.newAccount === 'true' || !!searchParams.editAccountId;
  
  // 💡 Extraemos explícitamente el ID para pasarlo
  const editAccountId = searchParams.editAccountId;
  
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
    // 💡 Quitamos 'overflow-hidden' temporalmente para asegurar que el fixed overlay funcione
    <div className="flex flex-col space-y-6 pb-20 relative min-h-screen">
      
      <div className="absolute top-0 right-6 z-[80]">
         <PageFilterBar 
           initialFilters={currentFilters}
           categories={flatCategories}
           tags={tags}
           accounts={accounts}
         />
      </div>

      <section className="space-y-2 mt-4">
        <AccountStageSelector accounts={accounts} activeId={selectedAccount.id} />
      </section>

      <section className="px-6 -mt-8">
        <AccountDetailsHeader account={selectedAccount} />
      </section>

      <section className="w-full px-6 mt-8">
        <h2 className="text-xl font-black italic mb-4">Recent Activity</h2>
        <TransactionTable transactions={transactions} />
      </section>

      {/** Modal de Transacciones */}
      {isTxModalOpen && ( 
        <TransactionModalWrapper /> 
      )}

      {/** Modal de Cuentas */}
      {isAccountModalOpen && ( 
        <AccountModalWrapper accountId={editAccountId} /> 
      )}
    </div>
  );
}