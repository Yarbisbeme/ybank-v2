'use client';

import Link from 'next/link';
import AccountCarousel from '@/components/accounts/AccountCarousel';
import CreditHealthBento from '@/components/dashboard/CreditHealthBento';
import MonthlyCategoryBreakdown from '@/components/dashboard/MonthlyCategoryBreakdown';
import HeroBalance from '@/components/dashboard/NetWorth/HeroBalance';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';

export default function DashboardPage() {
  return (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-8">
              <HeroBalance />
            </div>
            <div className="lg:col-span-4">
              <CreditHealthBento />
            </div>
          </div>

          <AccountCarousel />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <section
              aria-label="Actividad reciente"
              className="xl:col-span-8 flex flex-col gap-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="title text-ink">Actividad reciente</h2>
                <Link href="/transactions" className="small text-action hover:underline">
                  Ver todo
                </Link>
              </div>
              <TransactionFilterBar />
              <ClientTransactionTable />
            </section>

            <div className="xl:col-span-4">
              <MonthlyCategoryBreakdown />
            </div>
          </div>
        </div>
        );
}
