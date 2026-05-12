'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // 💡 Importamos framer-motion
import { Edit2, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { cn, getCategoryIcon } from '@/lib/utils'; // Asegúrate de que getCategoryIcon esté aquí

export default function TransactionDetailView({ 
  transaction, 
  categories, 
  accounts,
  onEditRequest 
}: any) {
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const items = transaction.items || [];
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  // Resolviendo Nodos (Cuentas)
  const originAccountName = accounts.find((acc: any) => acc.id === transaction.account_id)?.name || 'NODO GLOBAL';
  
  const destAccountId = transaction.transfer_to_account_id;
  const destAccountName = destAccountId 
    ? (accounts.find((acc: any) => acc.id === destAccountId)?.name || transaction.transfer_to_account?.name || 'Nodo Desconocido')
    : null;

  return (
    <div className="flex flex-col bg-card w-full h-full overflow-hidden rounded-[12px] border border-border shadow-sm relative">
      {/* === HEADER === */}
      <div className="relative flex flex-col items-center justify-center pt-10 pb-8 px-6 border-b border-border z-10 bg-background/95 backdrop-blur-sm">
        
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center mb-5 shadow-sm ring-4 ring-card",
          isTransfer ? "bg-blue-600/90 text-white" : 
          isIncome ? "bg-emerald-500/10 text-emerald-600" : 
          "bg-surface-2 text-foreground border border-border"
        )}>
          {isTransfer ? <ArrowRightLeft size={24} strokeWidth={2}/> : getCategoryIcon(transaction.category?.icon)}
        </div>
        
        <h2 className="text-base sm:text-lg font-semibold text-foreground text-center mb-1">
          {transaction.description || 'Operación sin descripción'}
        </h2>
        
        {/* El monto se mantiene estoico y legible (identidad dual mono) */}
        <p className={cn(
          "text-4xl sm:text-5xl font-mono font-bold tracking-tight mb-6",
          isExpense ? "text-foreground" : isIncome ? "text-emerald-600" : "text-primary"
        )}>
          {isExpense ? '-' : ''}${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>

        <button 
          onClick={onEditRequest}
          className="flex items-center gap-2 px-5 py-2.5 bg-background border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground hover:text-primary text-xs font-bold rounded-[8px] transition-all active:scale-95 shadow-sm group"
        >
          <Edit2 size={14} strokeWidth={2.5} className="text-muted-foreground group-hover:text-primary transition-colors" />
          {isTransfer ? 'Auditar Traspaso' : 'Auditar Operación'}
        </button>
      </div>

      {/* === METADATOS: Ruta Dinámica === */}
      <div className="px-6 py-5 border-b border-border bg-surface-2/30 relative z-10">
        {isTransfer ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 w-full">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Origen</span>
              <span className="text-sm font-medium text-foreground truncate">{originAccountName}</span>
            </div>
            
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border text-muted-foreground shadow-sm">
              <ArrowRight size={14} />
            </div>
            
            <div className="flex flex-col gap-1 w-full text-right">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Destino</span>
              <span className="text-sm font-medium text-foreground truncate">{destAccountName}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Nodo Contable Origen</span>
              <span className="text-sm font-medium text-foreground truncate">{originAccountName}</span>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Clasificación Principal</span>
              
              {/* 💡 3. SUPERFICIES TÁCTILES: Etiqueta de Categoría */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-background border border-border/60 shadow-sm w-fit max-w-full">
                <span className="text-muted-foreground shrink-0">
                  {getCategoryIcon(transaction.category?.icon)}
                </span>
                <span className="text-xs font-medium text-foreground truncate">
                  {transaction.category?.name || 'Múltiples (Desglose)'}
                </span>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* === DESGLOSE CONTABLE === */}
      <div className="p-6 bg-background flex-1 overflow-y-auto relative z-10">
          <div className="flex items-center justify-between mb-4 pr-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ítems Contables Registrados</h3>
            <span className="px-2.5 py-1 rounded-[6px] bg-surface-2 border border-border/50 text-[10px] font-mono font-bold text-foreground">
              {items.length} {items.length !== 1 ? 'ÍT_EMS' : 'ÍT_EM'}
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            {items.length === 0 && (
              <div className="text-center py-8 text-xs font-medium text-muted-foreground border border-dashed border-border rounded-[8px] bg-surface-2/30">
                No hay desglose detallado para esta operación.
              </div>
            )}
            
            {items.map((item: any, idx: number) => (
              /* 💡 4. MICRO-INTERACCIONES SERIAS: Reemplazamos el borde por una flecha de señalización lateral en hover */
              <div 
                key={item.id} 
                className="flex justify-between items-center p-3 rounded-[8px] border border-transparent hover:border-border hover:bg-surface-2/50 transition-all duration-200 group relative overflow-hidden pl-3"
              >
                {/* 💡 Flecha de señalización lateral (SERIA) */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center -translate-x-full group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100">
                  <ArrowRight size={14} className="text-primary/50" />
                </div>
                
                <div className="flex items-center gap-3.5 min-w-0 pr-4 pl-0 group-hover:pl-6 transition-all duration-200">
                  
                  {/* Índice tipo terminal para más seriedad */}
                  <span className="text-[10px] font-mono font-bold text-muted-foreground/30 shrink-0">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1.5 font-mono">
                      {item.category?.name || 'Sin clasificar'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono text-sm font-medium text-foreground">
                    ${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  
                  {!isTransfer && (
                    <button 
                      onClick={() => setEditingItemId(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-[6px] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Modificar ítem"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
                
              </div>
            ))}
          </div>
      </div>
      
    </div>
  );
}