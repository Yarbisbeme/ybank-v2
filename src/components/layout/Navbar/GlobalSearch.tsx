"use client";
// 💡 FIX 1: Importamos 'useTransition' junto con los hooks estándar
import React, { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Search, Tag as TagIcon, ArrowLeftIcon, Command, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation'; 
import { GlobalSearchProps } from '@/types';
import { getNodeIcon, getCategoryIcon } from '@/lib/utils'; 

import { useModalStore } from '@/store/useModalStore'; 
import { useFilterStore } from '@/store/useFilterStore';
import Image from 'next/image';

export default function GlobalSearch({ isOpen, onClose, query, setQuery, results, expanded, onToggleSection }: GlobalSearchProps) {
  const router = useRouter();
  const openModal = useModalStore((state) => state.openModal);
  const { setFilter } = useFilterStore();

  // 💡 FIX 2: Inicializamos el estado de transición de React
  // 'isPending' será TRUE de forma automática mientras Next.js descarga la nueva página.
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  // 💡 FIX 3: REACCIÓN TÁCTICA AL CAMBIO DE PÁGINA
  // Cuando 'isPending' vuelve a ser false y estábamos navegando, significa que la página destino 
  // ya cargó completamente sus datos. En ese milisegundo, cerramos el buscador limpiamente.
  useEffect(() => {
    if (!isPending && isNavigating) {
      onClose();
      setIsNavigating(false);
    }
  }, [isPending, isNavigating, onClose]);

  // === HANDLERS MÁGICOS DE CONTEXTO ===
  
  const handleAccountClick = (accId: string) => {
    setIsNavigating(true); // Encendemos el estado de navegación
    setFilter('accountId', accId); 
    
    // 💡 FIX 4: Envolvemos la navegación en startTransition
    startTransition(() => {
      router.push(`/accounts?accountId=${accId}`);
    });
  };

  const handleTransactionClick = (tx: any) => {
    openModal('transaction', { 
      transactionId: tx.id, 
      accountId: tx.account_id,
      initialData: tx 
    });
    onClose(); 
  };

  const handleTagClick = (tagId: string) => {
    setIsNavigating(true);
    setFilter('tagId', tagId); 
    
    startTransition(() => {
      router.push(`/transactions?tagId=${tagId}`);
    });
  };

  const handleViewMoreTransactions = () => {
    setIsNavigating(true);
    
    startTransition(() => {
      router.push(`/transactions?search=${encodeURIComponent(query)}`);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col md:items-center md:justify-start md:pt-[10vh] md:px-4">
          
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm hidden md:block" 
            onClick={isPending ? undefined : onClose} // 💡 Desactivamos el cierre si está cargando
          />
          
          <motion.div 
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full h-full md:h-auto md:max-w-2xl bg-card rounded-none md:rounded-[10px] shadow-2xl border-none md:border border-border overflow-hidden flex flex-col"
          >
            
            {/* 💡 FIX 5: EXPERIENCIA GLASSMORPHISM COMPLETA */}
            {/* Si Next.js está cargando la página, inyectamos una capa de cristal encima de todo con un Spinner */}
            <AnimatePresence>
              {isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/70 backdrop-blur-[3px] z-[210] flex flex-col items-center justify-center gap-3"
                >
                  <Loader2 className="animate-spin text-primary w-8 h-8" strokeWidth={2.5} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
                    Accediendo al Nodo...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Header del Buscador */}
            <div className="py-4 px-4 border-b border-border flex items-center gap-2 bg-surface-2/50 shrink-0">
              <button 
                onClick={onClose} 
                disabled={isPending}
                className="-ml-2 hover:bg-surface-2 rounded-[6px] text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border disabled:opacity-30"
              >
                <ArrowLeftIcon size={18} strokeWidth={2.5} />
              </button>
              <input 
                autoFocus
                disabled={isPending} // Deshabilitamos el input si ya está cargando
                type="text"
                placeholder="Buscar nodos, operaciones o tags..."
                className="flex-1 py-1 bg-transparent border-none outline-none text-sm font-mono font-medium text-foreground placeholder:text-muted-foreground/50 pl-2 disabled:opacity-50"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* CONTENEDOR DE RESULTADOS */}
            <div className="flex-1 md:max-h-[60vh] overflow-y-auto p-4 space-y-6 scrollbar-hide">
              <LayoutGroup>
                {query.trim() === '' ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="py-20 text-center flex flex-col items-center justify-center"
                  >
                    <div className="p-10 rounded-full bg-surface-2 border border-border mb-4 text-muted-foreground">
                      <div className="flex flex-row items-center cursor-pointer"> 
                        <Image 
                            src="/icons/logoY.svg" 
                            alt="YBank" 
                            width={42}
                            height={42}
                            priority
                            className="w-[50px] h-auto object-contain dark:invert"
                        />
                    </div>
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
                            layout key={acc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <button 
                              onClick={() => handleAccountClick(acc.id)}
                              disabled={isPending}
                              className="w-full text-left flex items-center gap-3 p-3 rounded-[8px] hover:bg-surface-2 border border-transparent hover:border-border transition-colors group disabled:opacity-50"
                            >
                              <div className="p-2 bg-surface-2 border border-border text-muted-foreground rounded-[6px] group-hover:text-primary transition-colors flex items-center justify-center">
                                {getNodeIcon(acc.type, 16)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{acc.name}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{acc.currency} • ****{acc.last_4_digits}</p>
                              </div>
                              <p className="text-sm font-mono font-bold text-foreground shrink-0">${acc.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </SearchSection>

                    {/* === SECCIÓN OPERACIONES === */}
                    <SearchSection 
                      title="Registro Operativo" 
                      count={results.transactions?.length || 0}
                      isExpanded={expanded.transactions}
                      // 💡 MODIFICACIÓN: Al hacer clic en "+X Más", ejecuta nuestro handler de redirección
                      onToggle={handleViewMoreTransactions} 
                    >
                      <AnimatePresence mode="popLayout">
                        {/* Muestra un preview limpio de 3 ítems en el buscador móvil/desktop */}
                        {results.transactions?.slice(0, 3).map((tx: any, idx: number) => (
                          <motion.div
                            layout key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <button 
                              onClick={() => handleTransactionClick(tx)}
                              disabled={isPending}
                              className="w-full text-left flex items-center gap-3 p-3 rounded-[8px] hover:bg-surface-2 border border-transparent hover:border-border transition-colors group disabled:opacity-50"
                            >
                              <div className={`p-2 rounded-[6px] border transition-colors bg-surface-2 flex items-center justify-center
                                ${tx.type === 'expense' ? 'border-border text-rose-500 group-hover:bg-rose-500/10' : 
                                  tx.type === 'income' ? 'border-border text-emerald-500 group-hover:bg-emerald-500/10' : 
                                  'border-border text-primary group-hover:bg-primary/10'}`}
                              >
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
                            </button>
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
                              layout key={tag.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ delay: idx * 0.02 }}
                            >
                              <button 
                                onClick={() => handleTagClick(tag.id)}
                                disabled={isPending}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2 border border-border rounded-[6px] hover:border-primary/50 transition-all text-muted-foreground hover:text-foreground text-[10px] uppercase tracking-widest font-bold disabled:opacity-50"
                              >
                                <TagIcon size={12} strokeWidth={2.5} />
                                {tag.name}
                              </button>
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
            <div className="hidden md:flex p-3 bg-surface-2 border-t border-border gap-4 justify-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">
               <span className="flex items-center gap-1.5"><kbd className="bg-card border border-border px-1.5 py-0.5 rounded-[4px] shadow-sm font-mono">ESC</kbd> CERRAR</span>
               <span className="flex items-center gap-1.5"><kbd className="bg-card border border-border px-1.5 py-0.5 rounded-[4px] shadow-sm font-mono">↵</kbd> SELECCIONAR</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

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