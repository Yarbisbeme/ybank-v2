"use client";
import React from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
// 💡 Eliminamos 'Server' de aquí porque ahora viene dinámico
import { Search, Receipt, Tag as TagIcon, X, Command } from 'lucide-react';
import Link from 'next/link';
import { GlobalSearchProps } from '@/types';
import { getNodeIcon, getCategoryIcon } from '@/lib/utils'; 

export default function GlobalSearch({ isOpen, onClose, query, setQuery, results, expanded, onToggleSection }: GlobalSearchProps) {
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-card rounded-[10px] shadow-2xl border border-border overflow-hidden flex flex-col"
          >
            
            {/* Header del Buscador (Terminal Input) */}
            <div className="p-4 border-b border-border flex items-center gap-3 bg-surface-2/50">
              <Search className="text-muted-foreground" size={18} strokeWidth={2.5} />
              <input 
                autoFocus
                type="text"
                placeholder="Buscar nodos, operaciones o clasificadores..."
                className="flex-1 py-1 bg-transparent border-none outline-none text-sm font-mono font-medium text-foreground placeholder:text-muted-foreground/50 pl-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={onClose} className="p-1.5 hover:bg-surface-2 rounded-[6px] text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* CONTENEDOR DE RESULTADOS */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 scrollbar-hide">
              <LayoutGroup>
                {query.trim() === '' ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center flex flex-col items-center justify-center"
                  >
                    <div className="p-4 rounded-full bg-surface-2 border border-border mb-4 text-muted-foreground">
                      <Command size={32} strokeWidth={1.5} />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Esperando Comando...</p>
                  </motion.div>
                ) : (
                  <>
                    {/* === SECCIÓN NODOS === */}
                    <SearchSection 
                      title="Nodos" 
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
                              className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-surface-2 border border-transparent hover:border-border transition-colors group"
                            >
                              {/* 💡 AQUÍ ESTÁ LA MAGIA: Llamamos a getNodeIcon pasando el tipo de cuenta y el tamaño */}
                              <div className="p-2 bg-surface-2 border border-border text-muted-foreground rounded-[6px] group-hover:text-primary transition-colors flex items-center justify-center">
                                {getNodeIcon(acc.type, 16)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{acc.name}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{acc.currency} • ****{acc.last_4_digits}</p>
                              </div>
                              <p className="text-sm font-mono font-bold text-foreground shrink-0">${acc.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </Link>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </SearchSection>

                    {/* === SECCIÓN OPERACIONES === */}
                    <SearchSection 
                      title="Registro Operativo" 
                      count={results.transactions?.length || 0}
                      isExpanded={expanded.transactions}
                      onToggle={() => onToggleSection('transactions')}
                    >
                      <AnimatePresence mode="popLayout">
                        {(expanded.transactions ? results.transactions : results.transactions?.slice(0, 3))?.map((tx: any, idx: number) => (
                          <motion.div
                            layout
                            key={tx.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <Link 
                              href={`/dashboard?editTx=${tx.id}`}
                              onClick={onClose}
                              className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-surface-2 border border-transparent hover:border-border transition-colors group"
                            >
                              <div className={`p-2 rounded-[6px] border transition-colors bg-surface-2 flex items-center justify-center
                                ${tx.type === 'expense' ? 'border-border text-rose-500 group-hover:bg-rose-500/10' : 
                                  tx.type === 'income' ? 'border-border text-emerald-500 group-hover:bg-emerald-500/10' : 
                                  'border-border text-primary group-hover:bg-primary/10'}`}
                              >
                                {/* 💡 YBANK Telemetry: Ícono real de la base de datos mapeado a Lucide */}
                                {getCategoryIcon(tx.category?.icon)} 
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{tx.description || 'Operación'}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                  {new Date(tx.date).toLocaleDateString('es-DO', { month: 'short', day: '2-digit' }).replace(',', '')} • {tx.account?.name || 'Nodo'}
                                </p>
                              </div>
                              <p className={`text-sm font-mono font-bold shrink-0 ${tx.type === 'expense' ? 'text-foreground' : 'text-emerald-500'}`}>
                                {tx.type === 'expense' ? '-' : '+'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                            </Link>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </SearchSection>

                    {/* === SECCIÓN CLASIFICADORES (TAGS) === */}
                    <SearchSection 
                      title="Clasificadores" 
                      count={results.tags?.length || 0}
                      isExpanded={expanded.tags}
                      onToggle={() => onToggleSection('tags')}
                    >
                      <AnimatePresence mode="popLayout">
                        <div className="flex flex-wrap gap-2">
                          {(expanded.tags ? results.tags : results.tags?.slice(0, 5))?.map((tag: any, idx: number) => (
                            <motion.div
                              layout
                              key={tag.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ delay: idx * 0.02 }}
                            >
                              <Link 
                                href={`/dashboard?tagId=${tag.id}`}
                                onClick={onClose}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2 border border-border rounded-[6px] hover:border-primary/50 transition-all text-muted-foreground hover:text-foreground text-[10px] uppercase tracking-widest font-bold"
                              >
                                <TagIcon size={12} strokeWidth={2.5} />
                                {tag.name}
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    </SearchSection>
                  </>
                )}
              </LayoutGroup>
            </div>
            
            {/* Footer Helpers */}
            <div className="p-3 bg-surface-2 border-t border-border flex gap-4 justify-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
               <span className="flex items-center gap-1.5"><kbd className="bg-card border border-border px-1.5 py-0.5 rounded-[4px] shadow-sm font-mono">ESC</kbd> CERRAR</span>
               <span className="flex items-center gap-1.5"><kbd className="bg-card border border-border px-1.5 py-0.5 rounded-[4px] shadow-sm font-mono">↵</kbd> SELECCIONAR</span>
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
        <h3 className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{title}</h3>
        {count > 3 && (
          <button onClick={onToggle} className="text-[9px] font-bold text-foreground hover:bg-surface-2 border border-border bg-card px-2 py-0.5 rounded-[4px] transition-colors uppercase tracking-widest">
            {isExpanded ? 'COLAPSAR' : `+${count - 3} MÁS`}
          </button>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </motion.div>
  );
}