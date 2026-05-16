'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { cn, getCategoryIcon } from '@/lib/utils';

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

  // 💡 1. DICCIONARIO DE TEMAS (Color Coding)
  // Definimos las paletas exactas para cada estado para mantener Tailwind feliz (sin interpolar strings)
  const theme = {
    expense: {
      icon: "bg-rose-500/10 text-rose-600 border-rose-200/50",
      amount: "text-rose-600",
      buttonHover: "hover:border-rose-500/50 hover:bg-rose-500/5 hover:text-rose-600",
      iconHover: "group-hover:text-rose-600",
      badge: "bg-rose-500/5 border-rose-500/20 text-rose-600",
      arrow: "text-rose-500/50",
    },
    income: {
      icon: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
      amount: "text-emerald-600",
      buttonHover: "hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-600",
      iconHover: "group-hover:text-emerald-600",
      badge: "bg-emerald-500/5 border-emerald-500/20 text-emerald-600",
      arrow: "text-emerald-500/50",
    },
    transfer: {
      icon: "bg-blue-500/10 text-blue-600 border-blue-200/50",
      amount: "text-blue-600",
      buttonHover: "hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-600",
      iconHover: "group-hover:text-blue-600",
      badge: "bg-blue-500/5 border-blue-500/20 text-blue-600",
      arrow: "text-blue-500/50",
    }
  }[isExpense ? 'expense' : isIncome ? 'income' : 'transfer'];

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
        
        {/* 💡 Ícono principal con color de tipo */}
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center mb-5 shadow-sm ring-4 ring-card border",
          theme.icon
        )}>
          {isTransfer ? <ArrowRightLeft size={24} strokeWidth={2}/> : getCategoryIcon(transaction.category?.icon)}
        </div>
        
        <h2 className="text-base sm:text-lg font-semibold text-foreground text-center mb-1">
          {transaction.description || 'Operación sin descripción'}
        </h2>
        
        {/* 💡 Monto con color de tipo */}
        <p className={cn(
          "text-4xl sm:text-5xl font-mono font-bold tracking-tight mb-6",
          theme.amount
        )}>
          {isExpense ? '-' : ''}${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>

        {/* 💡 Botón con hover dinámico según el tipo */}
        <button 
          onClick={onEditRequest}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 bg-background border border-border text-foreground text-xs font-bold rounded-[8px] transition-all active:scale-95 shadow-sm group",
            theme.buttonHover
          )}
        >
          <Edit2 size={14} strokeWidth={2.5} className={cn("text-muted-foreground transition-colors", theme.iconHover)} />
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
            
            {/* 💡 Flecha de traspaso tintada */}
            <div className={cn("flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-background border shadow-sm", theme.badge)}>
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
              
              {/* 💡 Etiqueta de Categoría con fondo/borde dinámico */}
              <div className={cn("inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border shadow-sm w-fit max-w-full", theme.badge)}>
                <span className="shrink-0 opacity-80">
                  {getCategoryIcon(transaction.category?.icon)}
                </span>
                <span className="text-xs font-bold truncate">
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
              <div 
                key={item.id} 
                className="flex justify-between items-center p-3 rounded-[8px] border border-transparent hover:border-border hover:bg-surface-2/50 transition-all duration-200 group relative overflow-hidden pl-3"
              >
                {/* 💡 Flecha lateral coloreada */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center -translate-x-full group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100">
                  <ArrowRight size={14} className={theme.arrow} />
                </div>
                
                <div className="flex items-center gap-3.5 min-w-0 pr-4 pl-0 group-hover:pl-6 transition-all duration-200">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground/30 shrink-0">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  
                  <div className="flex flex-col min-w-0">
                    {/* 💡 Texto hace hover en el color de la transacción */}
                    <p className={cn("text-sm font-medium text-foreground truncate transition-colors leading-tight", theme.iconHover)}>
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
                      className={cn("p-1.5 text-muted-foreground rounded-[6px] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100", theme.buttonHover)}
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