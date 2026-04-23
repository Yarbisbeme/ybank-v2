'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShoppingCart, Home } from 'lucide-react';

// Imagina que este es el componente que renderiza UNA sola fila de tu tabla
export function TransactionRow({ tx }: { tx: any }) {
  // 💡 Controla si el desglose está abierto o cerrado
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulación de sub-transacciones (Esto vendría de tu base de datos)
  const hasSubTransactions = tx.subTransactions && tx.subTransactions.length > 0;

  return (
    <div className="flex flex-col border-b border-slate-100 last:border-0">
      
      {/* === FILA PRINCIPAL (Siempre visible) === */}
      <div 
        // 💡 Solo es clickeable si tiene sub-transacciones (o para abrir el modal de edición)
        onClick={() => hasSubTransactions ? setIsExpanded(!isExpanded) : null}
        className={`flex items-center justify-between py-4 ${hasSubTransactions ? 'cursor-pointer active:bg-slate-50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
             {/* Tu ícono de categoría aquí */}
             <ShoppingCart size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{tx.description}</p>
            <p className="text-xs text-slate-400">{tx.categoryName} • {tx.date}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm font-black text-slate-800">
            -${tx.amount}
          </p>
          {/* 💡 Indicador visual de que se puede expandir */}
          {hasSubTransactions && (
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown size={16} className="text-slate-400" />
            </motion.div>
          )}
        </div>
      </div>

      {/* === ÁREA EXPANDIBLE (Las sub-transacciones) === */}
      <AnimatePresence initial={false}>
        {isExpanded && hasSubTransactions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden" // 💡 Vital para que el height: 0 funcione limpio
          >
            <div className="pl-12 pr-4 pb-4 space-y-3 bg-slate-50/50 rounded-b-xl mb-2">
              {/* Lista de sub-transacciones */}
              {tx.subTransactions.map((sub: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>{sub.categoryName}</span>
                    {sub.note && <span className="text-slate-400 italic">({sub.note})</span>}
                  </div>
                  <span className="font-bold text-slate-600">-${sub.amount}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}