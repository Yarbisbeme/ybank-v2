'use client'

import { RefreshCw } from 'lucide-react';
import { useTransactionsList } from '@/hooks/useCatalogs';
import TransactionTable from './RecentActivityTable';

export default function ClientTransactionTable() {
  const { data: transactions = [], isLoading, isFetching } = useTransactionsList();

  return (
    <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
      
      <TransactionTable transactions={transactions} />

      {isFetching && (
        <p className="flex justify-center items-center gap-2 text-center text-[9px] font-bold uppercase tracking-widest text-primary animate-pulse mt-4">
          <RefreshCw size={12} className="animate-spin" />
          Sincronizando Telemetría...
        </p>
      )}
    </div>
  );
}