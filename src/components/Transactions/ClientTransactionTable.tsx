'use client'

import { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Calculator, X } from 'lucide-react';
import { useTransactionsList, useAccounts } from '@/hooks/useCatalogs';
import TransactionTable from './TransactionTable'; 
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilterStore } from '@/store/useFilterStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { useYBankStore } from '@/store/useYBankStore';

export default function ClientTransactionTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  
  // 🛑 1. TRAEMOS EL ESTADO DE ZUSTAND
  const { isSelectionMode, selectedTx, setSelectedTx, clearSelection, toggleSingleTx, setTotalItemsInView } = useSelectionStore();

  const { preferredAccountId } = useYBankStore();
  const urlAccountId = searchParams.get('accountId');
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  
  const activeAccountId = useMemo(() => {
    return urlAccountId || preferredAccountId || accounts[0]?.id || null;
  }, [urlAccountId, preferredAccountId, accounts]);

  const { data, isLoading: isLoadingTx, isFetching } = useTransactionsList(currentPage);
  const transactions = data?.transactions || [];
  const totalItems = data?.total || 0;
  const filters = useFilterStore();

  const isQueryLoading = isLoadingTx || isLoadingAccounts || !activeAccountId;

  // Sincronizamos el totalItems hacia Zustand para que la barra de filtros lo lea
  useEffect(() => {
    setTotalItemsInView(totalItems);
  }, [totalItems, setTotalItemsInView]);

  // Si los filtros cambian, vaciamos la selección
  useEffect(() => {
    if (Object.keys(selectedTx).length > 0 || isSelectionMode) {
      clearSelection();
    }
  }, [filters.type, filters.categoryId, filters.startDate, filters.endDate, clearSelection]);

  // 🧮 2. MATEMÁTICA SIMPLIFICADA
  const selectionSummary = useMemo(() => {
    const values = Object.values(selectedTx);
    if (values.length === 0) return { count: 0, total: 0 };

    const total = values.reduce((sum: number, tx: any) => {
      const amount = Number(tx.amount) || 0;
      
      // 💡 ¡MIRA QUÉ LIMPIO! Como el interceptor ya disfrazó los traspasos de esta cuenta 
      // en 'income' y 'expense', la matemática vuelve a ser de escuela primaria.
      if (tx.type === 'income') return sum + amount;
      if (tx.type === 'expense') return sum - amount;
      
      // Solo caerá aquí si estamos en la vista Global (donde siguen siendo 'transfer')
      return sum; 
    }, 0);

    return { count: values.length, total };
  }, [selectedTx]);
  
  return (
    <div className={`relative transition-opacity duration-300 ${isFetching && !isQueryLoading ? 'opacity-80' : 'opacity-100'}`}>
      
      {isQueryLoading ? (
        <p className="flex justify-center items-center gap-2 text-center text-[9px] font-bold uppercase tracking-widest text-primary animate-pulse mt-4 py-8">
          <RefreshCw size={12} className="animate-spin" />
          Sincronizando Telemetría...
        </p>
      ) : (
        <TransactionTable 
          transactions={transactions} 
          activeAccountId={activeAccountId} 
          currentPage={currentPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          isSelectionMode={isSelectionMode}
          selectedTx={selectedTx}
          onToggleSingle={toggleSingleTx}
        />
      )}

      {/* Indicador de actualización en segundo plano */}
      {isFetching && !isQueryLoading && (
         <div className="absolute top-0 right-2 flex items-center justify-center p-1 bg-surface-2 rounded-full shadow-sm z-10">
            <RefreshCw size={14} className="animate-spin text-blue-500" />
         </div>
      )}

      {/* 🧮 BARRA FLOTANTE DE RESULTADOS */}
      <AnimatePresence>
        {isSelectionMode && selectionSummary.count > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-foreground text-background px-4 py-3 rounded-2xl shadow-2xl border border-border"
          >
            <div className="flex items-center gap-2 bg-background/20 px-3 py-1.5 rounded-[8px]">
              <Calculator size={16} />
              <span className="text-[10px] font-bold tracking-widest">{selectionSummary.count} ÍTEMS</span>
            </div>
            
            <div className="flex flex-col border-l border-background/20 pl-4">
              <span className="text-[8px] text-background/60 font-bold uppercase tracking-widest leading-none mb-1">Flujo Seleccionado</span>
              <span className={`text-xl font-black leading-none tracking-tight ${selectionSummary.total < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {selectionSummary.total < 0 ? '-' : '+'}${Math.abs(selectionSummary.total).toLocaleString('en-US', {minimumFractionDigits: 2})}
              </span>
            </div>

            <button onClick={() => setSelectedTx({})} className="ml-2 p-1.5 text-background/50 hover:text-background hover:bg-background/20 rounded-full transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}