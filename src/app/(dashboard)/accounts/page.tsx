// src/app/(dashboard)/accounts/page.tsx
import AccountDetailsHeader from '@/components/accounts/AccountDetailsHeader';
import AccountStageSelector from '@/components/accounts/AccountStageSelector';
import TransactionTable from '@/components/Transactions/RecentActivityTable';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';
import { Zap } from 'lucide-react'; 

export default async function AccountsPage(props: { 
  searchParams: Promise<{ accountId?: string }> 
}) {
  const searchParams = await props.searchParams;
  const initialAccountId = searchParams.accountId;

  return (
    <div className="max-w-[1400px] mx-auto sm:px-4 md:px-8 sm:py-6 space-y-8 sm:pb-20">
      
      {/* Header Estático */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hidden sm:block">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-muted-foreground" />
          <h1 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Control de Nodos
          </h1>
        </div>
      </div>

      {/* Selector de Cuentas: Ahora es autónomo */}
      <section>
        <AccountStageSelector initialAccountId={initialAccountId} />
      </section>

      {/* Detalle de Cuenta: Ahora escucha al store de Zustand */}
      <section>
        <AccountDetailsHeader />
      </section>

      {/* Registro de Operaciones: Usamos la tabla cliente reactiva */}
      <section className="pt-8">
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