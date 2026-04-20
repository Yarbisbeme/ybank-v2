// app/accounts/page.tsx
import AccountDetailsHeader from '@/components/accounts/AccountDetailsHeader';
import AccountStageSelector from '@/components/accounts/AccountStageSelector';
import TransactionsList from '@/components/accounts/TransactionsList';
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper';
import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';

export default async function AccountsPage(props: { searchParams: Promise<{ accountId?: string }> }) {
  const { accountId } = await props.searchParams;
  const accounts = await getAccounts();
  const selectedAccount = accountId ? (accounts.find(a => a.id === accountId) || accounts[0]) : accounts[0];
  const { transactions } = await getTransactions({ accountId: selectedAccount.id });

  return (
    <div className="flex flex-col space-y-6 pb-20 overflow-hidden">
      <section className="space-y-2">
        <div className="px-6 flex justify-between items-end">
          <h1 className="text-2xl font-black italic tracking-tighter">My Wallets</h1>
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{accounts.length} Nodes</span>
        </div>
        
        {/* EL NUEVO COMPONENTE AISLADO */}
        <AccountStageSelector accounts={accounts} activeId={selectedAccount.id} />
      </section>

      <section className="px-6 -mt-8">
        <AccountDetailsHeader account={selectedAccount} />
      </section>

      <section className="px-6 space-y-4">
        <h2 className="text-xl font-black italic">Recent Activity</h2>
        <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden">
          <TransactionsList transactions={transactions} emptyMessage="No hay transacciones registradas en esta cuenta." />
        </div>
      </section>

      <TransactionModalWrapper />
    </div>
  );
}