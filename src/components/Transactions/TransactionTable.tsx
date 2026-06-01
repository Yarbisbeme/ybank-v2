'use client';

import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { TransactionRow } from './TransactionRow';
import { motion, AnimatePresence } from 'framer-motion';

export default function TransactionTable({ 
  transactions, 
  activeAccountId,
  currentPage,
  totalItems,
  onPageChange,
  isSelectionMode = false, // 👈 Nuevos Props
  selectedTx = {},
  onToggleSingle
}: { 
  transactions: any[],
  activeAccountId?: string | null,
  currentPage: number,
  totalItems: number,
  onPageChange: (page: number) => void,
  isSelectionMode?: boolean,
  selectedTx?: Record<string, any>,
  onToggleSingle?: (tx: any) => void
}) {
  const itemsPerPage = 10; 
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col w-full items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-[10px] bg-surface-2/30 mt-4">
        <div className="p-3 bg-surface-2 rounded-full flex items-center justify-center mb-3">
          <RefreshCw size={20} className="text-muted-foreground" />
        </div>
        <h3 className="text-label text-muted-foreground">Sin Telemetría</h3>
      </div>
    );
  }

  const handlePrevPage = () => onPageChange(Math.max(currentPage - 1, 1));
  const handleNextPage = () => onPageChange(Math.min(currentPage + 1, totalPages));

  return (
    <div className="w-full flex flex-col pb-8">
      <div className="border-t border-border mt-2">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center gap-1 group">
            
            <AnimatePresence>
              {isSelectionMode && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }} 
                  animate={{ width: 36, opacity: 1 }} 
                  exit={{ width: 0, opacity: 0 }}
                  className="flex justify-center overflow-hidden shrink-0"
                >
                  <input 
                    type="checkbox"
                    checked={!!selectedTx[tx.id]}
                    onChange={() => onToggleSingle && onToggleSingle(tx)}
                    className="w-[18px] h-[18px] rounded-[6px] border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer bg-surface-2 transition-all hover:border-primary/50"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 min-w-0 transition-all">
              <TransactionRow 
                tx={tx} 
                activeAccountId={activeAccountId} 
              />
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-2">
          <p className="text-label text-muted-foreground">
            Pág <span className="text-foreground">{currentPage}</span> de <span className="text-foreground">{totalPages}</span>
          </p>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="btn-secondary flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-border text-label text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft size={12} strokeWidth={3} /> Ant
            </button>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="btn-secondary flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-border text-label text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Sig <ChevronRight size={12} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}