'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useFilterStore } from '@/store/useFilterStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { useCategories, useAccounts } from '@/hooks/useCatalogs';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, ChevronDown, CheckSquare, Square, RefreshCw, MousePointerSquareDashed } from 'lucide-react';
import { cn, getCategoryIcon } from '@/lib/utils';
import { format } from 'date-fns';
import FilterTab from '../filters/FilterTab';
import YBankCalendarPicker from '../filters/YBankCalendarPicker';
import { useSearchParams } from 'next/navigation';
import { getTransactions } from '@/lib/actions/transactions';
import { toast } from 'sonner';

export default function TransactionFilterBar() {
  
  const searchParams = useSearchParams();
  const { type, categoryId, startDate, endDate, search, setFilter, clearFilters } = useFilterStore();
  const { data: categoriesTree = [] } = useCategories();
  
  const { isSelectionMode, setIsSelectionMode, selectedTx, setSelectedTx, clearSelection, totalItemsInView } = useSelectionStore();
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  
  const urlAccountId = searchParams.get('accountId');
  const activeAccountId = (!urlAccountId || urlAccountId === 'global') ? null : urlAccountId;
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setIsCategoryOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flatCategories = categoriesTree.flatMap(c => [c, ...(c.subcategories || [])]);
  const selectedCategory = flatCategories.find(c => c.id === categoryId);
  const hasActiveFilters = type || categoryId || startDate || endDate;
  const isAllSelected = totalItemsInView > 0 && Object.keys(selectedTx).length === totalItemsInView;

  const handleSelectAllInAccount = async () => {
    // 💡 FIX 2: Quitamos el "!activeAccountId" de la validación.
    // Ahora es perfectamente válido que no haya cuenta (porque significa que queremos TODO).
    if (isFetchingAll) return; 
    
    if (isAllSelected) {
      setSelectedTx({});
      return;
    }

    setIsFetchingAll(true);
    try {
      const activeFilters = {
        ...(type && { type }), 
        ...(categoryId && { categoryId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(search && { search }),
      };

      const res = await getTransactions({ 
        // 💡 FIX 3: Si activeAccountId es null, pasamos undefined para que Supabase traiga todo el universo.
        accountId: activeAccountId || undefined, 
        pageSize: 5000, 
        page: 1,
        filters: activeFilters 
      });
      
      const newMap: Record<string, any> = {};
      res.transactions.forEach((t: any) => newMap[t.id] = t);
      setSelectedTx(newMap);
      toast.success(`${res.transactions.length} registros listos para calcular.`);
    } catch (error) {
      toast.error('Necesitas conexión para cargar el historial filtrado completo.');
    } finally {
      setIsFetchingAll(false);
    }
  };

return (
    // 💡 1. Añadimos flex-wrap aquí para que los elementos bajen si no caben
    <div className="flex flex-col xl:flex-row flex-wrap items-start xl:items-center gap-2.5 py-2 w-full relative z-20">
      
      {/* 1. PESTAÑAS DESLIZABLES */}
      <div className="flex items-center p-1 bg-surface-2 border border-border rounded-[8px] w-full xl:w-auto overflow-x-auto scrollbar-hide shrink-0 snap-x">
        <div className="min-w-max flex items-center">
          <FilterTab active={!type} onClick={() => setFilter('type', null)} label="Global" />
          <FilterTab active={type === 'income'} onClick={() => setFilter('type', 'income')} label="Ingresos" />
          <FilterTab active={type === 'expense'} onClick={() => setFilter('type', 'expense')} label="Gastos" />
          <FilterTab active={type === 'transfer'} onClick={() => setFilter('type', 'transfer')} label="Traspasos" />
        </div>
      </div>

      {/* 💡 2. Añadimos flex-wrap al contenedor secundario también */}
      <div className="flex flex-col sm:flex-row flex-wrap flex-1 w-full gap-2.5 relative z-30">
        
        {/* 2. AREA DE FILTROS SECUNDARIOS (Cat y Date) */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
          
          {/* CATEGORÍAS */}
          <AnimatePresence>
            {type !== 'transfer' && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                className="relative col-span-1" ref={categoryRef}
              >
                <button 
                  onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsDateOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full h-8 px-2.5 bg-card border hover:border-primary/50 rounded-[6px] transition-all group",
                    isCategoryOpen ? "border-primary shadow-[0_0_0_2px_rgba(37,99,235,0.1)]" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest shrink-0 hidden md:inline">Cat:</span>
                    {selectedCategory ? (
                      <>
                        <span className="text-primary shrink-0">{getCategoryIcon(selectedCategory.icon)}</span>
                        <span className="text-[11px] font-bold text-foreground truncate">{selectedCategory.name}</span>
                      </>
                    ) : (
                      <span className="text-[11px] font-bold text-foreground truncate">Todas</span>
                    )}
                  </div>
                  <ChevronDown size={14} className={cn("text-muted-foreground transition-transform shrink-0 ml-1", isCategoryOpen && "rotate-180 text-primary")} />
                </button>

                <AnimatePresence>
                  {isCategoryOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.98 }} transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1.5 w-[220px] bg-card border border-border shadow-xl rounded-[8px] overflow-hidden z-50"
                    >
                      <div className="max-h-[300px] overflow-y-auto p-1.5 scrollbar-hide flex flex-col gap-0.5">
                        <button 
                          onClick={() => { setFilter('categoryId', null); setIsCategoryOpen(false); }}
                          className="flex items-center w-full px-2.5 py-2 hover:bg-surface-2 rounded-[6px] text-xs font-bold text-foreground transition-colors"
                        >
                          Mostrar Todas
                        </button>
                        {flatCategories.filter(c => type ? c.type === type : true).map(cat => (
                          <button 
                            key={cat.id} 
                            onClick={() => { setFilter('categoryId', cat.id); setIsCategoryOpen(false); }}
                            className={cn(
                              "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[6px] text-xs font-bold text-left transition-colors",
                              categoryId === cat.id ? "bg-primary/10 text-primary" : "hover:bg-surface-2 text-foreground"
                            )}
                          >
                            <span className={categoryId === cat.id ? "text-primary" : "text-muted-foreground"}>{getCategoryIcon(cat.icon)}</span>
                            <span className="truncate">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FECHAS */}
          <motion.div 
            layout className={cn("relative", type === 'transfer' ? "col-span-2" : "col-span-1")} ref={dateRef}
          >
            <button 
              onClick={() => { setIsDateOpen(!isDateOpen); setIsCategoryOpen(false); }}
              className={cn(
                "flex items-center justify-between w-full h-8 px-2.5 bg-card border hover:border-primary/50 rounded-[6px] transition-all group",
                isDateOpen ? "border-primary shadow-[0_0_0_2px_rgba(37,99,235,0.1)]" : "border-border"
              )}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <CalendarIcon size={12} strokeWidth={2.5} className={cn("shrink-0 transition-colors hidden sm:block", isDateOpen || startDate ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("font-mono text-[10px] font-bold truncate", startDate ? "text-foreground" : "text-muted-foreground")}>
                  {startDate ? format(new Date(startDate + 'T00:00:00'), 'dd/MM') : 'INICIO'}
                </span>
                <span className="text-muted-foreground font-mono text-[9px] font-black opacity-50">-</span>
                <span className={cn("font-mono text-[10px] font-bold truncate", endDate ? "text-foreground" : "text-muted-foreground")}>
                  {endDate ? format(new Date(endDate + 'T00:00:00'), 'dd/MM') : 'CIERRE'}
                </span>
              </div>
              <ChevronDown size={14} className={cn("text-muted-foreground transition-transform shrink-0 ml-1", isDateOpen && "rotate-180 text-primary")} />
            </button>
          </motion.div>
        </div>

        {/* 💡 3. BARRA DE ACCIONES (Limpiamos el div duplicado) */}
        <div className="flex items-center w-full sm:w-auto sm:ml-auto gap-2 shrink-0">
          
          <AnimatePresence mode="popLayout">
            {/* BOTÓN PRIMARIO */}
            {!isSelectionMode ? (
              <motion.button 
                key="btn-select"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setIsSelectionMode(true)}
                className="flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap gap-1.5 h-8 px-3 rounded-[6px] text-[9px] font-bold uppercase tracking-widest transition-all active:scale-95 bg-surface-2 border border-border text-foreground hover:bg-card"
              >
                <MousePointerSquareDashed size={12} />
                <span>Seleccionar</span>
              </motion.button>
            ) : (
              <motion.button 
                key="btn-todo"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={handleSelectAllInAccount} disabled={isFetchingAll}
                className="flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap gap-1.5 h-8 px-3 rounded-[6px] bg-primary/10 border border-primary/20 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isFetchingAll ? <RefreshCw size={12} className="animate-spin" /> : isAllSelected ? <Square size={12} /> : <CheckSquare size={12} />}
                <span>{isAllSelected ? 'Deseleccionar' : `Todo (${totalItemsInView})`}</span>
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {/* BOTÓN SECUNDARIO (ESCAPE HATCH) */}
            {(isSelectionMode || hasActiveFilters) && (
              <motion.button 
                key="btn-escape"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                onClick={() => {
                  if (isSelectionMode) {
                    clearSelection();
                  } else {
                    clearFilters();
                  }
                }}
                className={cn(
                  "flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap gap-1.5 h-8 px-3 rounded-[6px] text-[9px] uppercase tracking-widest font-bold transition-all active:scale-95 border",
                  isSelectionMode 
                    ? "bg-foreground text-background border-foreground hover:bg-foreground/90 shadow-sm"
                    : "bg-transparent border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                )}
              >
                <X size={12} strokeWidth={3} />
                <span>{isSelectionMode ? 'Cerrar' : 'Reset'}</span>
              </motion.button>
            )}
          </AnimatePresence>

        </div>
      </div>

      <YBankCalendarPicker 
        isOpen={isDateOpen}
        mode="range"
        triggerRef={dateRef}
        startDate={startDate} 
        endDate={endDate} 
        setFilter={setFilter} 
        onClose={() => setIsDateOpen(false)} 
      />

    </div>
  );
}