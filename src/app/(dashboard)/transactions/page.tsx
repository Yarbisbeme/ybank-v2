'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFilterStore } from '@/store/useFilterStore';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';

export default function TransactionsLedgerPage() {
  const searchParams = useSearchParams();
  const { setFilter, clearFilters } = useFilterStore();

  useEffect(() => {
    const tagId = searchParams.get('tagId');
    const type = searchParams.get('type');
    const accountId = searchParams.get('accountId');
    const categoryId = searchParams.get('categoryId');
    const searchQuery = searchParams.get('search'); 

    if (tagId) setFilter('tagId', tagId);
    if (type) setFilter('type', type as any);
    if (accountId) setFilter('accountId', accountId);
    if (categoryId) setFilter('categoryId', categoryId); 
    
    if (searchQuery) {
      setFilter('search', decodeURIComponent(searchQuery));
    }

    return () => {
      clearFilters();
    };
  }, [searchParams, setFilter, clearFilters]);

  return (
    <div className="max-w-[1400px] mx-auto sm:px-4 md:px-8 py-4 sm:py-6 space-y-6">
      
      {/* HEADER DE CONTROL */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground mt-0.5">Historial Operativo Completo</h1>  
      </div>

      {/* CORE DE TRANSACCIONES REUTILIZADO */}
      <section className="sm:bg-card sm:p-4 sm:rounded-t-[16px] sm:-mx-4 sm:border sm:border-border">
        <TransactionFilterBar />
        <ClientTransactionTable />
      </section>
    </div>
  );
}