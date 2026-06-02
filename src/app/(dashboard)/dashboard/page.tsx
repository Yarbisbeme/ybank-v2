'use client'

// Ya no necesitamos importar los server actions aquí
import HeroBalance from '@/components/dashboard/NetWorth/HeroBalance';
import CreditHealthBento from '@/components/dashboard/CreditHealthBento'; 
import AccountCarousel from '@/components/accounts/AccountCarousel';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';

export default function DashboardPage() {
  
  return (
    <div className="max-w-[1400px] mx-auto mt-6 sm:mt-0 sm:px-4 md:px-8 space-y-8 md:space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto">
        <div className="md:col-span-12 lg:col-span-8"> 
          <HeroBalance /> 
        </div>

        <div className="md:col-span-12 lg:col-span-4">
          <CreditHealthBento />
        </div>
      </div>

      <div>
        <AccountCarousel />
      </div>
      <section className="sm:bg-card sm:p-4 sm:rounded-t-[16px] sm:-mx-4 sm:border sm:border-border">
        <div className="flex items-center gap-2 sm:py-4 justify-center sm:block py-1">
           <h3 className="font-bold uppercase tracking-[0.1em] text-muted-foreground">
             Transacciones Globales
           </h3>
        </div>
        
        <TransactionFilterBar />
        <ClientTransactionTable /> 
      </section>
    </div>
  );
}