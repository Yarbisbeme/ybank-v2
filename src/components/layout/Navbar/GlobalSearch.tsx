"use client";
import React from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'; // 💡 Importamos lo necesario
import { Search, CreditCard, Receipt, Tag as TagIcon, X, Command } from 'lucide-react';
import Link from 'next/link';
import { GlobalSearchProps } from '@/types';


export default function GlobalSearch({ isOpen, onClose, query, setQuery, results, expanded, onToggleSection }: GlobalSearchProps) {
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
          
          {/* 💡 OVERLAY CON FADE */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          {/* 💡 VENTANA PRINCIPAL CON SCALE + SPRING */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            
            {/* Header del Buscador */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="text-blue-500" size={20} />
              <input 
                autoFocus
                type="text"
                placeholder="Buscar cuentas, transacciones o etiquetas..."
                className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-800 placeholder:text-slate-400 pl-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* 💡 CONTENEDOR DE RESULTADOS CON LAYOUT ANIMATION */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 scrollbar-hide">
              <LayoutGroup>
                {query.trim() === '' ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center"
                  >
                    <Command size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-medium italic">Escribe algo para filtrar...</p>
                  </motion.div>
                ) : (
                  <>
                    <SearchSection 
                      title="Cuentas" 
                      count={results.accounts.length}
                      isExpanded={expanded.accounts}
                      onToggle={() => onToggleSection('accounts')}
                    >
                      <AnimatePresence mode="popLayout">
                        {(expanded.accounts ? results.accounts : results.accounts.slice(0, 3)).map((acc, idx) => (
                          <motion.div
                            layout
                            key={acc.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <Link 
                              href={`/accounts?accountId=${acc.id}`}
                              onClick={onClose}
                              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors group"
                            >
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <CreditCard size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{acc.name}</p>
                                <p className="text-[10px] font-medium text-slate-400 uppercase">{acc.currency} • ****{acc.last_4_digits}</p>
                              </div>
                              <p className="text-sm font-black text-slate-700 shrink-0">${acc.current_balance.toLocaleString()}</p>
                            </Link>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </SearchSection>

                    {/* SECCIÓN TRANSACCIONES (Repetir lógica de AnimatePresence + layout) */}
                    
                  </>
                )}
              </LayoutGroup>
            </div>
            
            {/* Footer Helpers */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-4 justify-center text-[10px] font-bold text-slate-400">
               <span className="flex items-center gap-1"><kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm">ESC</kbd> cerrar</span>
               <span className="flex items-center gap-1"><kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm">↵</kbd> seleccionar</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// 💡 SUB-COMPONENTE CON ANIMACIÓN DE TÍTULO
function SearchSection({ title, count, children, isExpanded, onToggle }: any) {
  if (count === 0) return null;
  return (
    <motion.div layout className="overflow-hidden">
      <div className="flex justify-between items-center mb-3 px-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
        {count > 3 && (
          <button onClick={onToggle} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full transition-colors">
            {isExpanded ? 'Ver menos' : `+${count - 3} más`}
          </button>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </motion.div>
  );
}