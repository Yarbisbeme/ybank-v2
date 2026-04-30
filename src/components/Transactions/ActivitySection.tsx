// ActivitySection.tsx
"use client";

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Transaction } from '@/types';
import { TransactionFilters as FilterType } from '@/types/database.types';
import TransactionFilters from './TransactionFilter';
import TransactionTable from './RecentActivityTable';
// 💡 Importamos SlidersHorizontal para el botón de parámetros
import { Activity, SlidersHorizontal } from 'lucide-react'; 

interface ActivitySectionProps {
  transactions: Transaction[];
  initialFilters: FilterType;
  categories: any[];
  tags: any[];
  accounts: any[];
}

export default function ActivitySection({ transactions, initialFilters, categories, tags, accounts }: ActivitySectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  
  // 💡 YBANK Logic: Estado para colapsar/expandir el panel de parámetros
  const [showFilters, setShowFilters] = useState(false);

  // 💡 YBANK Logic: Contamos cuántos parámetros (filtros) están activos
  const activeFiltersCount = Object.keys(initialFilters).filter(
    key => initialFilters[key as keyof FilterType] !== null && 
           initialFilters[key as keyof FilterType] !== undefined && 
           initialFilters[key as keyof FilterType] !== '' &&
           key !== 'accountId' // Ignoramos accountId si siempre hay uno por defecto
  ).length;

  const handleFilterChange = (newFilters: FilterType) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className={`w-full transition-opacity duration-300 ${isPending ? 'opacity-60 pointer-events-none cursor-wait' : 'opacity-100'}`}>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-border pb-3">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity size={16} strokeWidth={2.5} className="text-muted-foreground" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Registro Operativo
            </h3>
          </div>
          
          <span className="px-1.5 py-0.5 rounded-[4px] bg-surface-2 border border-border text-[9px] font-mono font-bold text-foreground">
            {transactions.length}
          </span>
          {isPending && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2"></div>}
        </div>
        
        <TransactionFilters 
          currentFilters={initialFilters} 
          onFilterChange={handleFilterChange}
          categories={categories}
          tags={tags}
          accounts={accounts}
        />
      </div>
      
      {/* LA TABLA DE DATOS PUROS */}
      <TransactionTable transactions={transactions} />
      
      {isPending && (
        <p className="text-center text-[9px] font-bold uppercase tracking-widest text-primary animate-pulse mt-4">
          Sincronizando Telemetría...
        </p>
      )}
    </div>
  );
}