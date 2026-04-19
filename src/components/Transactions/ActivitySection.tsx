"use client";

import React from 'react';
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

  // 💡 Lógica para manejar el cambio de filtros y actualizar la URL
  const handleFilterChange = (newFilters: FilterType) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Actualiza la URL sin hacer scroll hacia arriba
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full">
      {/* 1. Header de la sección (Título + Filtros) */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h3>
        
        {/* Usamos el componente de filtros que ya teníamos */}
        <TransactionFilters 
          currentFilters={initialFilters} 
          onFilterChange={handleFilterChange}
          categories={categories}
          tags={tags}
          accounts={accounts}
        />
      </div>
      
      {/* 2. La Tabla de Transacciones */}
      <TransactionTable transactions={transactions} />
    </div>
  );
}