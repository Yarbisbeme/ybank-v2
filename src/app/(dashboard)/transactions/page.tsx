'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFilterStore } from '@/store/useFilterStore';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';
import { ArrowLeft, Landmark } from 'lucide-react';
import Link from 'next/link';

export default function TransactionsLedgerPage() {
  const searchParams = useSearchParams();
  const { setFilter, clearFilters } = useFilterStore();

  useEffect(() => {
    const tagId = searchParams.get('tagId');
    const type = searchParams.get('type');
    const accountId = searchParams.get('accountId');
    const searchQuery = searchParams.get('search'); // 💡 Capturamos la 'j' de la URL

    // Inicializamos los filtros en el store de Zustand
    if (tagId) setFilter('tagId', tagId);
    if (type) setFilter('type', type as any);
    if (accountId) setFilter('accountId', accountId);
    
    // 💡 SOLUCIÓN: Activamos el estado de texto en el store
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
      <section className="space-y-4">
        <TransactionFilterBar />
        <ClientTransactionTable />
      </section>
    </div>
  );
}