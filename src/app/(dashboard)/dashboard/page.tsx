'use client';

import AccountCarousel from '@/components/accounts/AccountCarousel';
import CreditHealthBento from '@/components/dashboard/CreditHealthBento';
import HeroBalance from '@/components/dashboard/NetWorth/HeroBalance';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <HeroBalance />
        </div>
        <div className="lg:col-span-4">
          <CreditHealthBento />
        </div>
      </div>

      <AccountCarousel />

      <section aria-label="Movimientos recientes" className="flex flex-col gap-4">
        <h2 className="title text-ink">Movimientos recientes</h2>
        <TransactionFilterBar />
        <ClientTransactionTable />
      </section>
    </div>
  );
}
