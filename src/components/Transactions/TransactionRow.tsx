'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShoppingCart } from 'lucide-react';
import { useModalStore } from '@/store/useModalStore';
import { getCategoryIcon } from '@/lib/utils';

export function TransactionRow({ tx, activeAccountId }: { tx: any, activeAccountId?: string | null }) {

  const [isExpanded, setIsExpanded] = useState(false);
  
  // 💡 1. EVALUACIÓN DE CONTEXTO
  const isTransfer = tx.type === 'transfer';
  const isReceiver = isTransfer && tx.transfer_to_account_id === activeAccountId;
  
  // 💡 2. VALORES MUTADOS SEGÚN EL ROL
  const displayAmount = isReceiver ? (tx.target_amount || tx.amount) : tx.amount;
  const displayType = isTransfer 
    ? (isReceiver ? 'income' : (tx.account_id === activeAccountId ? 'expense' : 'transfer')) 
    : tx.type;
  
  // Si soy receptor, no veo el desglose (DGII).
  const displayItems = isReceiver ? [] : (tx.items || []);

  const openModal = useModalStore((state) => state.openModal);

  const isPositive = displayType === 'income';
  const amountColor = isPositive ? 'text-emerald-500' : (displayType === 'expense' ? 'text-foreground' : 'text-blue-500');
  const amountPrefix = isPositive ? '+' : (displayType === 'expense' ? '-' : '');
  
  // 💡 3. USAR DISPLAY ITEMS EN VEZ DE TX.ITEMS
  const items = displayItems;
  const hasSubTransactions = items.length > 0;

  const handleOpenEditModal = () => {
    openModal('transaction', { 
      transactionId: tx.id, 
      accountId: tx.account_id,
      initialData: tx // Pasamos la data cruda original para que el formulario la entienda
    });
  };

  const [year, month, day] = tx.date.split('T')[0].split('-');
  const safeDate = new Date(Number(year), Number(month) - 1, Number(day));
  return (
    <div className="flex flex-col border-b border-border last:border-0">
      
      {/* === FILA PRINCIPAL === */}
      <div 
        onClick={handleOpenEditModal}
        className="flex items-center justify-between py-4 px-2 md:px-4 transition-colors cursor-pointer active:bg-surface-2 hover:bg-surface-2/50 group"
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {/* 💡 4. Usar displayType para los colores del ícono */}
          <div className={`w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 border transition-colors
            ${displayType === 'expense' ? 'bg-surface-2 border-border text-rose-500 group-hover:bg-rose-500/10' : 
              displayType === 'income' ? 'bg-surface-2 border-border text-emerald-500 group-hover:bg-emerald-500/10' : 
              'bg-surface-2 border-border text-primary group-hover:bg-primary/10'}`}
          >
              {getCategoryIcon(tx.category?.icon)}
          </div>
          <div className="min-w-0"> 
            <p className="text-sm font-bold text-foreground line-clamp-1">{tx.description || 'Operación Genérica'}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">
              {/* 💡 5. Ajustar texto si es transferencia recibida */}
              {isReceiver ? `Desde ${tx.account?.name || 'Otra Cuenta'}` : (tx.category?.name || (hasSubTransactions ? 'Desglosado' : 'Transferencia'))} • {safeDate.toLocaleDateString('es-DO', { month: 'short', day: '2-digit' }).replace(',', '')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 💡 6. Usar amountColor, amountPrefix y displayAmount */}
          <p className={`text-sm font-mono font-bold tracking-tight ${amountColor}`}>
            {amountPrefix}${Number(displayAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          
          {hasSubTransactions && (
            <motion.div 
              animate={{ rotate: isExpanded ? 180 : 0 }}
              onClick={(e) => {
                e.stopPropagation(); 
                setIsExpanded(!isExpanded);
              }}
              className="p-1 rounded-[4px] hover:bg-surface-2 text-muted-foreground transition-colors"
            >
              <ChevronDown size={16} strokeWidth={2.5} />
            </motion.div>
          )}
        </div>
      </div>
        
      <AnimatePresence initial={false}>
        {isExpanded && hasSubTransactions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="ml-[44px] mr-4 mb-4 pl-3 border-l border-border/60 space-y-2.5">
              
              <div className="flex items-center justify-between mb-2">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Desglose Contable</p>
                <p 
                  onClick={handleOpenEditModal}
                  className="text-[8px] font-bold text-primary cursor-pointer hover:underline uppercase tracking-[0.2em]"
                >
                  Auditar
                </p>
              </div>
              
              {items.map((sub: any, i: number) => (
                <div key={sub.id || i} className="flex justify-between items-start text-xs group/sub">
                  <div className="flex items-start gap-2 text-foreground truncate pr-2">
                    <span className="text-muted-foreground opacity-50 mt-[-2px]">↳</span>
                    <div className="flex flex-col">
                      <span className="font-bold uppercase tracking-wide text-[10px] leading-tight text-foreground">{sub.category?.name || 'CATEGORÍA'}</span>
                      {sub.name && <span className="text-muted-foreground text-[10px] truncate leading-tight">{sub.name}</span>}
                    </div>
                  </div>
                  <span className="font-mono font-medium text-muted-foreground shrink-0 text-[11px] mt-0.5">
                    ${Number(sub.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}