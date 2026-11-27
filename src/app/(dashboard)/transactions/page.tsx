'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFilterStore } from '@/store/useFilterStore';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';

export default function TransactionsLedgerPage() {
  const searchParams = useSearchParams();
  const { setFilter, clearFilters } = useFilterStore();

  useEffect(() => {
    const tagId = searchParams.get('tagId');
    const type = searchParams.get('type');
    const accountId = searchParams.get('accountId');
    const categoryId = searchParams.get('categoryId');
    const searchQuery = searchParams.get('search');

    if (tagId) {
      setFilter('tagId', tagId);
    }
    if (type === 'expense' || type === 'income' || type === 'transfer') {
      setFilter('type', type);
    }
    if (accountId) {
      setFilter('accountId', accountId);
    }
    if (categoryId) {
      setFilter('categoryId', categoryId);
    }
    if (searchQuery) {
      setFilter('search', decodeURIComponent(searchQuery));
    }

    return () => {
      clearFilters();
    };
  }, [searchParams, setFilter, clearFilters]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-line pb-4">
        <h1 className="title-l text-ink">Movimientos</h1>
        <p className="small text-ink-2">
          Consulta, filtra y selecciona tus ingresos, gastos y traspasos.
        </p>
      </div>

      <section aria-label="Listado de movimientos" className="flex flex-col gap-4">
        <TransactionFilterBar />
        <ClientTransactionTable />
      </section>
    </div>
  );
}
