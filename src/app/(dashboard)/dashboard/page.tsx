import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import NetWorthCard from '@/components/dashboard/NetWorth/NetWorthCard';
import FinancialHealthCard from '@/components/dashboard/FinancialHealthCard'; // Componente nuevo
import RecentActivityTable from '@/components/dashboard/RecentActivityTable'; // Componente nuevo
import AccountCarousel from '@/components/dashboard/AccountCarousel';

export default async function DashboardPage() {
  const accounts = await getAccounts();
  const { transactions } = await getTransactions({ pageSize: 5 });

  return (
    <div className="max-w-[1600px] mx-auto space-y-10">

    {/* SECCIÓN SUPERIOR: HERO + HEALTH */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <div className="lg:col-span-2">
        <NetWorthCard accounts={accounts} transactions={transactions} />
      </div>
      <div>
        <FinancialHealthCard accounts={accounts} />
      </div>
    </div>

    {/* SECCIÓN CUENTAS (Scroll Horizontal) */}
    <AccountCarousel accounts={accounts} />

    {/* Transacciones */}
    <section className="mt-10">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h2>
      <RecentActivityTable transactions={transactions} />
    </section>

    </div>
  );
}