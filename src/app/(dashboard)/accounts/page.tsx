'use client'

import { useSearchParams } from 'next/navigation';
import AccountDetailsHeader from '@/components/accounts/AccountDetailsHeader';
import AccountStageSelector from '@/components/accounts/AccountStageSelector';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';
import { Zap } from 'lucide-react'; 

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const initialAccountId = searchParams.get('accountId') || "";

  return (
    <div className="max-w-[1400px] mx-auto sm:px-4 md:px-8 sm:pt-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hidden sm:block">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-muted-foreground" />
          <h1 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Control de Nodos
          </h1>
        </div>
      </div>

      <section>
        <AccountStageSelector initialAccountId={initialAccountId} />
      </section>

      <section>
        <AccountDetailsHeader />
      </section>

      <section className="pt-8">
        <div className="flex items-center gap-2 mb-4">
           <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
             Registro de Operaciones del Nodo
           </h2>
        </div>
        <TransactionFilterBar />
        <ClientTransactionTable /> 
      </section>
    </div>
  );
}