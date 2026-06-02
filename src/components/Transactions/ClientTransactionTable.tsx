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
import { cn } from '@/lib/utils';

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
  const baseTransactions = data?.transactions || [];
  const totalItems = data?.total || 0;
  const filters = useFilterStore();
  
  const transactions = useMemo(() => {
    // Si no estamos filtrando por categoría, dejamos todo intacto
    if (!filters.categoryId) return baseTransactions;

    const flat: any[] = [];
    
    baseTransactions.forEach((tx: any) => {
      let addedAsChild = false;
      
      // 1. Si la transacción tiene desgloses
      if (tx.items && tx.items.length > 0) {
        const matching = tx.items.filter((i: any) => i.category_id === filters.categoryId);
        
        if (matching.length > 0) {
          matching.forEach((item: any) => {
            flat.push({
              ...tx,
              id: `${tx.id}-item-${item.id}`, // ID virtual para la calculadora
              amount: Number(item.unit_price) * Number(item.quantity || 1), // Monto exacto del hijo
              category_id: item.category_id,
              category: item.category || tx.category,
              description: `${tx.description} ↳ ${item.name || 'Desglose'}`,
              items: [], // 🚨 DESTRUIMOS EL ACORDEÓN FÍSICAMENTE AQUÍ
              is_split_child: true, // Nuestra bandera escudo
              type: 'expense' // Lo forzamos a gasto para los colores y matemáticas
            });
          });
          addedAsChild = true;
        }
      }

      // 2. Solo pasamos al padre si no encontramos hijos y el padre coincide
      if (!addedAsChild && tx.category_id === filters.categoryId) {
        flat.push({ ...tx, items: [] });
      }
    });
    
    return flat;
  }, [baseTransactions, filters.categoryId]);
  
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

  const selectionSummary = useMemo(() => {
    const values = Object.values(selectedTx);
    if (values.length === 0) return { count: 0, total: 0 };

    const total = values.reduce((sum: number, tx: any) => {
      const amount = Number(tx.amount) || 0;
      
      if (tx.is_split_child) return sum - amount;
      
      if (tx.type === 'income') return sum + amount;
      if (tx.type === 'expense') return sum - amount;
      
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

      {/* 🧮 BARRA FLOTANTE DE RESULTADOS (Estilo YBANK) */}
      <AnimatePresence>
        {isSelectionMode && selectionSummary.count > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0, scale: 0.9 }} 
            animate={{ y: 0, opacity: 1, scale: 1 }} 
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            // Fondo negro absoluto, bordes sutiles y sombra profunda para que "flote" sobre la tabla
            className="fixed bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#09090b] text-white p-2 pr-3 rounded-[16px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] border border-white/10 backdrop-blur-md"
          >
            
            {/* 💡 BADGE DE CONTEO */}
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-[10px]">
              <Calculator size={14} className="text-zinc-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100 mt-0.5">
                {selectionSummary.count} {selectionSummary.count === 1 ? 'Ítem' : 'Ítems'}
              </span>
            </div>
            
            {/* 💡 TOTAL CALCULADO (Tipografía Monoespaciada) */}
            <div className="flex flex-col border-l border-white/10 pl-3 py-0.5">
              <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em] leading-none mb-1.5">
                Flujo Calculado
              </span>
              <span className={cn(
                "text-lg sm:text-xl font-mono font-black leading-none tracking-tight",
                selectionSummary.total < 0 ? 'text-rose-400' : 'text-emerald-400'
              )}>
                {selectionSummary.total < 0 ? '-' : '+'}${Math.abs(selectionSummary.total).toLocaleString('en-US', {minimumFractionDigits: 2})}
              </span>
            </div>

            {/* 💡 BOTÓN DE CIERRE (Consistente con el resto de la app) */}
            <button 
              onClick={() => setSelectedTx({})} 
              className="ml-1 p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-[8px] transition-colors active:scale-90"
              title="Limpiar selección"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}