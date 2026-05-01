// Ya no necesitamos importar los server actions aquí
import HeroBalance from '@/components/dashboard/NetWorth/HeroBalance';
import CreditHealthBento from '@/components/dashboard/CreditHealthBento'; 
import AccountCarousel from '@/components/accounts/AccountCarousel';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';

export default async function DashboardPage() {
  return (
    <div className="max-w-[1400px] mx-auto sm:px-4 md:px-8 sm:py-6 space-y-8 md:space-y-10">
      
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

      <section className="sm:pt-0">
        <div className="flex items-center gap-2 mb-6">
           <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
             Registro de Operaciones
           </h2>
        </div>
        
        <TransactionFilterBar />
        <ClientTransactionTable /> 
      </section>
    </div>
  );
}