import AccountDetailsHeader from '@/components/accounts/AccountDetailsHeader';
import AccountStageSelector from '@/components/accounts/AccountStageSelector';
import PageFilterBar from '@/components/Transactions/PageFilterBar';
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper';
import TransactionsDrawer from '@/components/Transactions/TransactionsDrawer'; 

import { getAccounts, getAccountById } from '@/lib/actions/accounts'; // 💡 Importamos getAccountById
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';
import { getInstitutions } from '@/lib/actions/institutions'; // 💡 Importamos getInstitutions
import { TransactionFilters as FilterType } from '@/types/database.types';
import { ChevronUp } from 'lucide-react'; 

import UniversalModal from '@/components/ui/UniversalModal';
import AccountFormWrapper from '@/components/accounts/AccountFormWrapper';

// 💡 Fallback necesario si creamos una cuenta nueva
const fallbackInstitution = {
  id: '', name: '', logo_url: null, exchange_rate_adjustment: 0, exchange_rate_buy_adjustment: 0, created_at: new Date().toISOString(), brand_color_primary: '#1e3a8a'
};

export default async function AccountsPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  
  const searchParams = await props.searchParams;
  const isTxModalOpen = searchParams.newTx === 'true' || !!searchParams.editTx;
  const isAccountModalOpen = searchParams.newAccount === 'true' || !!searchParams.editAccountId;
  
  const editAccountId = searchParams.editAccountId;
  const accountId = searchParams.accountId;

  // 1. Carga de datos base de la página
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

  // 🛡️ 2. CARGA CONDICIONAL (La magia del rendimiento)
  // Solo consultamos las instituciones y el detalle de la cuenta si el usuario abre el modal
  let initialData = undefined;
  let institutionsData = [];

  if (isAccountModalOpen) {
    const [fetchedAccount, fetchedInstitutions] = await Promise.all([
      editAccountId ? getAccountById(editAccountId) : Promise.resolve(null),
      getInstitutions() 
    ]);
    
    institutionsData = fetchedInstitutions;

    if (fetchedAccount) {
      initialData = {
        id: fetchedAccount.id,
        name: fetchedAccount.name,
        type: fetchedAccount.type,
        currency: fetchedAccount.currency,
        color: fetchedAccount.color || '#1e3a8a',
        custom_pattern: fetchedAccount.custom_pattern || 'solid',
        custom_text_theme: fetchedAccount.custom_text_theme || 'light',
        current_balance: fetchedAccount.current_balance || 0,
        last_4_digits: fetchedAccount.last_4_digits || '',
        institution: fetchedAccount.institution || fallbackInstitution,
        initial_balance: fetchedAccount.initial_balance,
        expiry_date: fetchedAccount.expiry_date,
        credit_limit: fetchedAccount.credit_limit,
        is_active: fetchedAccount.is_active,
      };
    }
  }

  return (
    <div className="flex flex-col relative h-[calc(100dvh-6rem)] md:h-auto md:min-h-screen md:overflow-auto bg-[#F8F9FB]">

        {/* ... Barra de filtros y zona principal se mantienen igual ... */}
        <div className="absolute top-4 right-6 z-[80] hidden md:block">
           <PageFilterBar initialFilters={currentFilters} categories={flatCategories} tags={tags} accounts={accounts} />
        </div>

        <div className="absolute top-4 right-6 z-[80] hidden md:block">
           <PageFilterBar initialFilters={currentFilters} categories={flatCategories} tags={tags} accounts={accounts} />
        </div>

        {/* === ZONA PRINCIPAL === */}
        <div className="flex flex-col items-center w-full h-full justify-start pt-12 md:pt-10 pb-4">
          
          <div className="w-full shrink-0 h-[320px] sm:h-[320px] md:h-[380px]">
            <AccountStageSelector accounts={accounts} activeId={selectedAccount.id} />
          </div>
          
          <div className="w-full px-4 shrink-0 mt-4 md:mt-6">
            <AccountDetailsHeader account={selectedAccount} />
          </div>

        </div>

        {/* 💡 FIX 2: Agregamos el Drawer interactivo que creamos para las transacciones */}
        <TransactionsDrawer transactions={transactions} />
        

        {/** === MODALES LIMPIOS === */}
        
        {/* 1. Modal de Transacciones */}
        {isTxModalOpen && <TransactionModalWrapper editTxId={searchParams.editTx} />}

        {/* 2. Nuevo Modal Universal para Cuentas */}
        {isAccountModalOpen && (
          <UniversalModal 
            title={editAccountId ? "Editar Cuenta" : "Nueva Cuenta"} 
          >
            <AccountFormWrapper initialData={initialData} institutions={institutionsData} />
          </UniversalModal>
        )}

    </div>
  );
}