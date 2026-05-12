'use client'

import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchableDropdown from '../ui/SearchableDropdown';

interface ExpenseSplitSectionProps {
  items: any[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  categoryOptions: any[];
  amount: string;
}

export default function ExpenseSplitSection({ items, setItems, categoryOptions, amount }: ExpenseSplitSectionProps) {
  
  const totalAmount = Number(amount) || 0;
  const currentSplitTotal = items.reduce((sum, item) => sum + (Number(item.unit_price) || 0), 0);
  const remaining = totalAmount - currentSplitTotal;
  const isPerfectMatch = Math.abs(remaining) < 0.01 && totalAmount > 0;

  const addItem = () => {
    const suggestedPrice = remaining > 0 ? remaining.toFixed(2) : '';
    setItems([...items, { _id: crypto.randomUUID(), name: '', unit_price: suggestedPrice, quantity: 1, category_id: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i._id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(i => i._id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="w-full flex flex-col py-3 font-sans">
      
      <div className="hidden md:grid grid-cols-12 gap-3 px-5 pb-1.5 border-b border-border/50 text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">
        <div className="col-span-5">Concepto del Ítem</div>
        <div className="col-span-4">Clasificación</div>
        <div className="col-span-3 text-right pr-6">Importe</div>
      </div>

      <div className="flex flex-col px-4 md:px-5 py-1">
        {items.map((item, index) => (
          /* 💡 Añadido relative y hover:z-20 para que el dropdown flote por encima de las demás filas */
          <div key={item._id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 py-2 md:border-b border-border/30 last:border-0 items-center relative hover:z-20 group">
            
            <div className="col-span-1 md:col-span-5 relative">
              <span className="md:hidden text-[9px] font-bold uppercase text-muted-foreground mb-0.5 block">Concepto</span>
              <input
                type="text" placeholder="Ej. Leche, Papel, etc." value={item.name} onChange={(e) => updateItem(item._id, 'name', e.target.value)}
                className="w-full bg-surface-2/30 md:bg-transparent border border-border/50 md:border-transparent rounded-[6px] md:rounded-none px-2.5 md:px-0 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary/20 md:focus:ring-0 md:focus:border-b-primary md:border-b transition-all placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="col-span-1 md:col-span-4 relative z-50">
               <span className="md:hidden text-[9px] font-bold uppercase text-muted-foreground mb-0.5 block">Clasificación</span>
               <div className="border border-border/50 md:border-transparent rounded-[6px] bg-surface-2/30 md:bg-transparent">
                  <SearchableDropdown
                    options={categoryOptions} value={item.category_id} onChange={(val) => updateItem(item._id, 'category_id', val)} placeholder="Clasificación..."
                  />
               </div>
            </div>

            <div className="col-span-1 md:col-span-3 flex items-center justify-between md:justify-end gap-2">
              <div className="flex-1 md:flex-none flex items-center relative">
                <span className="md:hidden text-[9px] font-bold uppercase text-muted-foreground mr-auto block">Importe</span>
                <span className="text-muted-foreground absolute left-2 md:left-0 md:-ml-3 text-xs">$</span>
                <input
                  type="text" inputMode="decimal" placeholder="0.00" value={item.unit_price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) updateItem(item._id, 'unit_price', val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && index === items.length - 1) { e.preventDefault(); addItem(); }
                  }}
                  className="w-full md:w-24 bg-surface-2/30 md:bg-transparent border border-border/50 md:border-transparent rounded-[6px] md:rounded-none pl-6 md:pl-1 pr-2 py-1.5 text-xs font-mono font-bold text-foreground text-right outline-none focus:ring-1 focus:ring-primary/20 md:focus:ring-0 md:focus:border-b-primary md:border-b transition-all"
                />
              </div>
              
              <button
                type="button" onClick={() => removeItem(item._id)} disabled={items.length === 1}
                className="p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-[4px] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 px-5 pt-3 border-t border-border/50">
        <button
          type="button" onClick={addItem}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 rounded-[6px] transition-colors"
        >
          <Plus size={14} /> Añadir Ítem (Enter)
        </button>

        <div className="flex items-center gap-3 bg-surface-2/30 p-2 rounded-[8px] border border-border/50 w-full sm:w-auto">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Desglosado</span>
            <span className={cn("text-sm font-mono font-black", isPerfectMatch ? "text-emerald-500" : "text-foreground")}>
              ${currentSplitTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="h-6 w-px bg-border/50" />
          
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Objetivo</span>
            <span className="text-xs font-mono font-bold text-muted-foreground/80">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="ml-1 border-l border-border/50 pl-3">
            {isPerfectMatch ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-500/10 text-rose-600 rounded-[4px]">
                <AlertCircle size={12} />
                <span className="text-[9px] font-bold font-mono">
                  {remaining > 0 ? `Faltan $${remaining.toFixed(2)}` : `Sobra $${Math.abs(remaining).toFixed(2)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}