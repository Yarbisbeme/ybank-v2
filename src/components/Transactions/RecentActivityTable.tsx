'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; // 💡 Importamos el router

// === COMPONENTE HIJO: La fila interactiva ===
function TransactionRow({ tx }: { tx: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 💡 Hooks de navegación para abrir el modal
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const items = tx.items || [];
  const hasSubTransactions = items.length > 0;

  const renderIcon = () => {
    if (tx.type === 'expense') return <ArrowDownCircle size={18} className="text-rose-500" />;
    if (tx.type === 'income') return <ArrowUpCircle size={18} className="text-emerald-500" />;
    return <RefreshCw size={18} className="text-blue-500" />;
  };

  // 💡 Función que abre nuestro Modal Universal en modo Edición
  const handleOpenEditModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('editTx', tx.id);
    // Mantiene los filtros actuales pero abre el modal por encima
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col border-b border-slate-100 last:border-0">
      
      {/* === FILA PRINCIPAL === */}
      <div 
        // 💡 1. Toda la fila ahora abre el Modal de Edición al hacer clic
        onClick={handleOpenEditModal}
        className="flex items-center justify-between py-4 px-2 md:px-4 transition-colors cursor-pointer active:bg-slate-50 hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
            ${tx.type === 'expense' ? 'bg-rose-50' : tx.type === 'income' ? 'bg-emerald-50' : 'bg-blue-50'}`}
          >
             {renderIcon()}
          </div>
          <div className="min-w-0"> 
            <p className="text-sm font-bold text-slate-800 line-clamp-1">{tx.description || 'Transacción'}</p>
            <p className="text-xs text-slate-400 capitalize truncate">
              {tx.category?.name || (hasSubTransactions ? 'Gasto Desglosado' : 'General')} • {new Date(tx.date).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <p className={`text-sm font-black ${tx.type === 'expense' ? 'text-slate-800' : 'text-emerald-600'}`}>
            {tx.type === 'expense' ? '-' : '+'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          
          {/* 💡 2. Botón del Acordeón (Aislado) */}
          {hasSubTransactions && (
            <motion.div 
              animate={{ rotate: isExpanded ? 180 : 0 }}
              // 💡 e.stopPropagation() evita que el clic en la flecha abra el modal
              onClick={(e) => {
                e.stopPropagation(); 
                setIsExpanded(!isExpanded);
              }}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
            >
              <ChevronDown size={18} strokeWidth={2.5} />
            </motion.div>
          )}
        </div>
      </div>

      {/* === ÁREA EXPANDIBLE (Sub-transacciones - Vistazo Rápido) === */}
      <AnimatePresence initial={false}>
        {isExpanded && hasSubTransactions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="ml-14 mr-4 mb-4 p-3 bg-[#F8F9FB] rounded-xl border border-slate-100 space-y-3 shadow-inner">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Desglose</p>
                {/* 💡 Pequeño enlace para que el usuario sepa que puede tocar para editar */}
                <p 
                  onClick={handleOpenEditModal}
                  className="text-[10px] font-bold text-blue-500 cursor-pointer hover:underline"
                >
                  Editar
                </p>
              </div>
              
              {items.map((sub: any, i: number) => (
                <div key={sub.id || i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-600 truncate pr-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    <span className="font-medium truncate">{sub.category?.name || 'Categoría'}</span>
                    {sub.name && <span className="text-slate-400 italic truncate">({sub.name})</span>}
                  </div>
                  <span className="font-bold text-slate-500 shrink-0">
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

// === COMPONENTE PADRE (Se queda igual) ===
export default function TransactionTable({ transactions }: { transactions: any[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <RefreshCw size={24} className="text-slate-300" />
        </div>
        <h3 className="text-slate-700 font-bold mb-1">No hay actividad</h3>
        <p className="text-slate-400 text-sm">No encontramos transacciones para esta cuenta.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pb-8">
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} />
      ))}
    </div>
  );
}