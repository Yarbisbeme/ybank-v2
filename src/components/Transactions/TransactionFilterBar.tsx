// components/filters/TransactionFilterBar.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useFilterStore } from '@/store/useFilterStore';
import { useCategories } from '@/hooks/useCatalogs';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { cn, getCategoryIcon } from '@/lib/utils';
import { format } from 'date-fns';
import FilterTab from '../filters/FilterTab';
import YBankCalendar from '../filters/YBankCalendarPicker';


export default function TransactionFilterBar() {
  const { type, categoryId, startDate, endDate, setFilter, clearFilters } = useFilterStore();
  const { data: categoriesTree = [] } = useCategories();
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setIsCategoryOpen(false);
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) setIsDateOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flatCategories = categoriesTree.flatMap(c => [c, ...(c.subcategories || [])]);
  const selectedCategory = flatCategories.find(c => c.id === categoryId);
  const hasActiveFilters = type || categoryId || startDate || endDate;

  return (
    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 py-2 w-full relative z-20">
      
      {/* 1. CONTROL SEGMENTADO */}
      <div className="flex items-center p-1 bg-surface-2 border border-border rounded-[8px] relative shrink-0">
        <FilterTab active={!type} onClick={() => setFilter('type', null)} label="Global" />
        <FilterTab active={type === 'income'} onClick={() => setFilter('type', 'income')} label="Ingresos" />
        <FilterTab active={type === 'expense'} onClick={() => setFilter('type', 'expense')} label="Gastos" />
        <FilterTab active={type === 'transfer'} onClick={() => setFilter('type', 'transfer')} label="Traspasos" />
      </div>

      <div className="flex flex-wrap items-center gap-3 flex-1 w-full relative z-30">
        
        {/* 2. DROPDOWN DE CATEGORÍAS */}
        {type !== 'transfer' && (
          <div className="relative" ref={categoryRef}>
            <button 
              onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsDateOpen(false); }}
              className={cn(
                "flex items-center gap-2 h-8 px-3 bg-card border hover:border-primary/50 rounded-[6px] transition-all group",
                isCategoryOpen ? "border-primary shadow-[0_0_0_2px_rgba(37,99,235,0.1)]" : "border-border"
              )}
            >
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest shrink-0">Cat:</span>
              <div className="flex items-center gap-1.5 shrink-0">
                 {selectedCategory ? (
                   <>
                     <span className="text-primary">{getCategoryIcon(selectedCategory.icon)}</span>
                     <span className="text-xs font-bold text-foreground truncate max-w-[120px]">{selectedCategory.name}</span>
                   </>
                 ) : (
                   <span className="text-xs font-bold text-foreground truncate max-w-[120px]">Todas</span>
                 )}
              </div>
              <ChevronDown size={14} className={cn("text-muted-foreground transition-transform ml-1", isCategoryOpen && "rotate-180 text-primary")} />
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
          </div>
        )}

        {/* 3. DATE RANGE PICKER (Consumiendo el módulo externo) */}
        <div className="relative" ref={dateRef}>
          <button 
            onClick={() => { setIsDateOpen(!isDateOpen); setIsCategoryOpen(false); }}
            className={cn(
              "flex items-center h-8 px-3 bg-card border hover:border-primary/50 rounded-[6px] transition-all group",
              isDateOpen ? "border-primary shadow-[0_0_0_2px_rgba(37,99,235,0.1)]" : "border-border"
            )}
          >
            <CalendarIcon size={12} strokeWidth={2.5} className={cn("mr-2 shrink-0 transition-colors", isDateOpen || startDate ? "text-primary" : "text-muted-foreground")} />
            <div className="flex items-center gap-1.5">
              <span className={cn("font-mono text-[10px] font-bold", startDate ? "text-foreground" : "text-muted-foreground")}>
                {startDate ? format(new Date(startDate + 'T00:00:00'), 'dd/MM/yyyy') : 'INICIO'}
              </span>
              <span className="text-muted-foreground font-mono text-[10px] font-bold">/</span>
              <span className={cn("font-mono text-[10px] font-bold", endDate ? "text-foreground" : "text-muted-foreground")}>
                {endDate ? format(new Date(endDate + 'T00:00:00'), 'dd/MM/yyyy') : 'CIERRE'}
              </span>
            </div>
            <ChevronDown size={14} className={cn("text-muted-foreground transition-transform ml-2", isDateOpen && "rotate-180 text-primary")} />
          </button>

          <AnimatePresence>
            {isDateOpen && (
              <YBankCalendar 
                startDate={startDate} 
                endDate={endDate} 
                setFilter={setFilter} 
                onClose={() => setIsDateOpen(false)} 
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. RESET BUTTON */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.button 
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            onClick={clearFilters}
            className="flex items-center justify-center gap-1.5 h-8 px-3 border border-border bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-[9px] uppercase tracking-widest font-bold rounded-[6px] transition-all shrink-0 xl:ml-auto"
          >
            <X size={12} strokeWidth={3} />
            <span>Reset</span>
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}