'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 💡 Añadimos ChevronLeft y ChevronRight para la paginación
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getCategoryIcon } from '@/lib/utils';

// === COMPONENTE HIJO: La fila interactiva ===
function TransactionRow({ tx }: { tx: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const items = tx.items || [];
  const hasSubTransactions = items.length > 0;

  const handleOpenEditModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('editTx', tx.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col border-b border-border last:border-0">
      
      {/* === FILA PRINCIPAL === */}
      <div 
        onClick={handleOpenEditModal}
        className="flex items-center justify-between py-4 px-2 md:px-4 transition-colors cursor-pointer active:bg-surface-2 hover:bg-surface-2/50 group"
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className={`w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 border transition-colors
            ${tx.type === 'expense' ? 'bg-surface-2 border-border text-rose-500 group-hover:bg-rose-500/10' : 
              tx.type === 'income' ? 'bg-surface-2 border-border text-emerald-500 group-hover:bg-emerald-500/10' : 
              'bg-surface-2 border-border text-primary group-hover:bg-primary/10'}`}
          >
             {getCategoryIcon(tx.category?.icon)}
          </div>
          <div className="min-w-0"> 
            <p className="text-sm font-bold text-foreground line-clamp-1">{tx.description || 'Operación Genérica'}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">
              {tx.category?.name || (hasSubTransactions ? 'Desglosado' : 'Sin Clasificar')} • {new Date(tx.date).toLocaleDateString('es-DO', { month: 'short', day: '2-digit' }).replace(',', '')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <p className={`text-sm font-mono font-bold tracking-tight ${tx.type === 'expense' ? 'text-foreground' : 'text-emerald-500'}`}>
            {tx.type === 'expense' ? '-' : '+'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          
          {hasSubTransactions && (
            <motion.div 
              animate={{ rotate: isExpanded ? 180 : 0 }}
              onClick={(e) => {
                e.stopPropagation(); 
                setIsExpanded(!isExpanded);
              }}
              className="p-1 rounded-[4px] hover:bg-surface-2 text-muted-foreground transition-colors"
            >
              <ChevronDown size={16} strokeWidth={2.5} />
            </motion.div>
          )}
        </div>
      </div>

      {/* === ÁREA EXPANDIBLE (Sub-transacciones YBANK Ledger Style) === */}
      <AnimatePresence initial={false}>
        {isExpanded && hasSubTransactions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            {/* 💡 YBANK Style: Indentación de árbol contable, sin cajas de fondo */}
            <div className="ml-[44px] mr-4 mb-4 pl-3 border-l border-border/60 space-y-2.5">
              
              <div className="flex items-center justify-between mb-2">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Desglose Contable</p>
                <p 
                  onClick={handleOpenEditModal}
                  className="text-[8px] font-bold text-primary cursor-pointer hover:underline uppercase tracking-[0.2em]"
                >
                  Auditar
                </p>
              </div>
              
              {items.map((sub: any, i: number) => (
                <div key={sub.id || i} className="flex justify-between items-start text-xs group/sub">
                  <div className="flex items-start gap-2 text-foreground truncate pr-2">
                    <span className="text-muted-foreground opacity-50 mt-[-2px]">↳</span>
                    <div className="flex flex-col">
                      <span className="font-bold uppercase tracking-wide text-[10px] leading-tight text-foreground">{sub.category?.name || 'CATEGORÍA'}</span>
                      {sub.name && <span className="text-muted-foreground text-[10px] truncate leading-tight">{sub.name}</span>}
                    </div>
                  </div>
                  <span className="font-mono font-medium text-muted-foreground shrink-0 text-[11px] mt-0.5">
                    ${Number(sub.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

// === COMPONENTE PADRE (Con Paginación YBANK) ===
export default function TransactionTable({ transactions }: { transactions: any[] }) {
  // 💡 Lógica de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-[10px] bg-surface-2/30 mt-4">
        <div className="p-3 bg-surface-2 rounded-full flex items-center justify-center mb-3">
          <RefreshCw size={20} className="text-muted-foreground" />
        </div>
        <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Sin Telemetría</h3>
      </div>
    );
  }

  // 💡 Cálculos de Paginación
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="w-full flex flex-col pb-8">
      {/* 💡 Lista renderizada con el slice actual */}
      <div className="border-t border-border mt-2">
        {currentTransactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>

      {/* 💡 Controles de Paginación Forenses */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-2">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            Pág <span className="text-foreground">{currentPage}</span> de <span className="text-foreground">{totalPages}</span>
          </p>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-border bg-surface-2 text-[9px] font-bold uppercase tracking-widest text-foreground hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft size={12} strokeWidth={3} /> Ant
            </button>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-border bg-surface-2 text-[9px] font-bold uppercase tracking-widest text-foreground hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Sig <ChevronRight size={12} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}