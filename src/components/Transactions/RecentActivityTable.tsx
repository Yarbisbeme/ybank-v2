'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { TransactionRow } from './TransactionRow';

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