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

  if (!selectedAccount) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] bg-[#F8F9FB]">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center border border-slate-100">
          <h2 className="text-xl font-black text-slate-800 mb-2">Aún no tienes cuentas</h2>
          <p className="text-sm text-slate-500 mb-6">Para registrar gastos e ingresos, primero debes crear una cuenta.</p>
          <a href="/accounts?newAccount=true" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
            Crear mi primera cuenta
          </a>
        </div>
      </div>
    );
  }

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
    <div className="flex flex-col relative h-[calc(100dvh-6rem)] md:h-auto md:min-h-screen sm:overflow-x-hidden bg-[#F8F9FB]">

        {/* === ZONA PRINCIPAL === */}
        <div className="flex flex-col items-center w-full justify-start pt-12 md:pt-10 pb-4">
          
          <div className="w-full shrink-0 h-[320px] sm:h-[320px] md:h-[380px]">
            <AccountStageSelector accounts={accounts} activeId={selectedAccount.id} />
          </div>
          
          <div className="w-full px-4 shrink-0 mt-4 md:mt-6">
            <AccountDetailsHeader account={selectedAccount} />
          </div>

        </div>

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