'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useFilterStore } from '@/store/useFilterStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { useCategories, useAccounts } from '@/hooks/useCatalogs';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, ChevronDown, CheckSquare, Square, RefreshCw, MousePointerSquareDashed, LayoutGrid } from 'lucide-react';
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
    if (isFetchingAll) return; 
    
    if (isAllSelected) {
      clearSelection();
      setIsSelectionMode(false);
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
        accountId: activeAccountId || undefined, 
        pageSize: 5000, 
        page: 1,
        filters: activeFilters 
      });
      
      const newMap: Record<string, any> = {};
      res.transactions.forEach((t: any) => newMap[t.id] = t);
      setSelectedTx(newMap);
    } catch (error) {
      toast.error('Necesitas conexión para cargar el historial filtrado completo.');
    } finally {
      setIsFetchingAll(false);
    }
  };

  let actionBtn = {
    label: "Seleccionar",
    icon: <MousePointerSquareDashed size={14} />,
    classes: "bg-surface-2 text-foreground border-border hover:bg-card",
    onClick: () => setIsSelectionMode(true) // Fase 1: Activa modo selección
  };

  if (isSelectionMode) {
    if (!isAllSelected) {
      actionBtn = {
        label: "Sel. Todo",
        icon: isFetchingAll ? <RefreshCw size={14} className="animate-spin" /> : <CheckSquare size={14} />,
        classes: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
        onClick: handleSelectAllInAccount // Fase 2: Selecciona la base de datos entera
      };
    } else {
      actionBtn = {
        label: "Deseleccionar",
        icon: <Square size={14} />,
        classes: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
        onClick: () => { clearSelection(); setIsSelectionMode(false); } // Fase 3: Reinicia todo y sale
      };
    }
  }

  return (
    <div className="flex flex-col xl:flex-row xl:items-center gap-2.5 py-2 w-full relative z-20">
      
      <div className="flex items-center p-1 h-8 bg-black/5 dark:bg-black/40 border border-border rounded-[8px] w-full xl:w-auto overflow-x-auto scrollbar-hide shrink-0 snap-x">
        <div className="h-full w-full min-w-max flex items-center">
          <FilterTab active={!type} onClick={() => setFilter('type', null)} label="Global" />
          <FilterTab active={type === 'income'} onClick={() => setFilter('type', 'income')} label="Ingresos" />
          <FilterTab active={type === 'expense'} onClick={() => setFilter('type', 'expense')} label="Gastos" />
          <FilterTab active={type === 'transfer'} onClick={() => setFilter('type', 'transfer')} label="Traspasos" />
        </div>
      </div>

      <div className="flex flex-row items-center flex-1 w-full gap-2 relative z-30">
        
        {/* CATEGORÍAS */}
        <AnimatePresence>
          {type !== 'transfer' && (
            <motion.div 
              layout initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
              className="relative shrink-0" ref={categoryRef}
            >
              <button 
                onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsDateOpen(false); }}
                className={cn(
                  "flex items-center justify-center h-8 px-2.5 sm:px-3 bg-card border hover:border-primary/50 rounded-[6px] transition-all group",
                  isCategoryOpen ? "border-primary shadow-[0_0_0_2px_rgba(37,99,235,0.1)]" : "border-border"
                )}
              >
                {selectedCategory ? (
                  <div className="flex items-center gap-1.5">
                    {/* 💡 Ícono con el color real inyectado desde la BD */}
                    <span style={{ color: selectedCategory.color || 'currentColor' }} className="shrink-0 flex items-center justify-center">
                      {getCategoryIcon(selectedCategory.icon)}
                    </span>
                    {/* El texto desaparece en móvil, pero reaparece en pantallas sm en adelante */}
                    <span className="hidden sm:inline text-[11px] font-bold truncate max-w-[80px]">{selectedCategory.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <LayoutGrid size={14} className="text-muted-foreground shrink-0" />
                    <span className="hidden sm:inline text-[11px] font-bold text-foreground">Categorías</span>
                  </div>
                )}
                <ChevronDown size={14} className="hidden sm:block text-muted-foreground ml-1 transition-transform" />
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
                          {/* El menú también respeta el color de la BD */}
                          <span style={{ color: cat.color || 'currentColor' }} className={cn(categoryId !== cat.id && "opacity-70")}>
                            {getCategoryIcon(cat.icon)}
                          </span>
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
        <motion.div layout className="relative shrink-0" ref={dateRef}>
          <button 
            onClick={() => { setIsDateOpen(!isDateOpen); setIsCategoryOpen(false); }}
            className={cn(
              "flex items-center justify-center h-8 px-2.5 sm:px-3 bg-card border hover:border-primary/50 rounded-[6px] transition-all group",
              isDateOpen ? "border-primary shadow-[0_0_0_2px_rgba(37,99,235,0.1)]" : "border-border"
            )}
          >
            {/* Solo ícono en móvil, verde si hay un filtro aplicado */}
            <CalendarIcon size={14} className={cn("shrink-0", startDate || endDate ? "text-primary" : "text-muted-foreground")} />
            
            <div className="hidden sm:flex items-center gap-1.5 ml-1.5">
              <span className={cn("font-mono text-[10px] font-bold truncate", startDate ? "text-foreground" : "text-muted-foreground")}>
                {startDate ? format(new Date(startDate + 'T00:00:00'), 'dd/MM') : 'INICIO'}
              </span>
              <span className="text-muted-foreground font-mono text-[9px] font-black opacity-50">-</span>
              <span className={cn("font-mono text-[10px] font-bold truncate", endDate ? "text-foreground" : "text-muted-foreground")}>
                {endDate ? format(new Date(endDate + 'T00:00:00'), 'dd/MM') : 'CIERRE'}
              </span>
            </div>
            <ChevronDown size={14} className="hidden sm:block text-muted-foreground ml-1" />
          </button>
        </motion.div>

        {/* CONTROLES DE ACCIÓN (Derecha) */}
        <div className="flex items-center flex-1 justify-end gap-2 overflow-hidden">
          
          {/* BOTÓN TRIPARTITO DE SELECCIÓN */}
          <motion.button 
            layout="position"
            key={actionBtn.label}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={actionBtn.onClick} disabled={isFetchingAll}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-1.5 h-8 px-3 rounded-[6px] text-[9px] font-bold uppercase tracking-widest transition-all active:scale-95 border disabled:opacity-50",
              // 💡 Eliminamos hover:bg-card si el fondo es bg-surface-2 (negro)
              actionBtn.classes
            )}
          >
            <span className="shrink-0">{actionBtn.icon}</span>
            <span className="truncate">{actionBtn.label}</span>
          </motion.button>

          <AnimatePresence mode="popLayout">
            {(isSelectionMode || hasActiveFilters) && (
              <motion.button 
                initial={{ opacity: 0, x: 10, width: 0 }} animate={{ opacity: 1, x: 0, width: 'auto' }} exit={{ opacity: 0, x: 10, width: 0 }}
                onClick={() => {
                  if (isSelectionMode) { clearSelection(); setIsSelectionMode(false); }
                  else clearFilters();
                }}
                className="hidden sm:flex items-center justify-center gap-1.5 h-8 px-3 rounded-[6px] text-[9px] uppercase tracking-widest font-bold transition-all border bg-transparent border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 shrink-0"
              >
                <X size={12} strokeWidth={3} />
                <span>{isSelectionMode ? 'Cancelar' : 'Reset'}</span>
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