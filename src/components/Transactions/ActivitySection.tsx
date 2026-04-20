"use client";

import React, { useTransition } from 'react'; // 💡 Importamos useTransition
import { useRouter, useSearchParams } from 'next/navigation';
import { Transaction } from '@/types';
import { TransactionFilters as FilterType } from '@/types/database.types';
import TransactionFilters from './TransactionFilter';
import TransactionTable from '../dashboard/RecentActivityTable';

interface ActivitySectionProps {
  transactions: Transaction[];
  initialFilters: FilterType;
  categories: any[];
  tags: any[];
  accounts: any[];
}

export default function ActivitySection({ 
  transactions, 
  initialFilters, 
  categories, 
  tags, 
  accounts 
}: ActivitySectionProps) {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 💡 isPending será true mientras el servidor procesa el cambio de URL
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newFilters: FilterType) => {
    // 💡 Envolvemos la lógica en startTransition
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className={`w-full transition-all duration-300 ${isPending ? 'opacity-50 pointer-events-none cursor-wait' : 'opacity-100'}`}>
      
      {/* Header con Título e indicador de carga discreto */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h3>
          {isPending && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        
        <TransactionFilters 
          currentFilters={initialFilters} 
          onFilterChange={handleFilterChange}
          categories={categories}
          tags={tags}
          accounts={accounts}
        />
      </div>
      
      {/* La Tabla de Transacciones */}
      <TransactionTable transactions={transactions} />
      
      {/* Opcional: Un overlay de texto si quieres ser más explícito */}
      {isPending && (
        <p className="text-center text-xs font-bold text-blue-600 animate-pulse mt-4">
          Updating records...
        </p>
      )}
    </div>
  );
}