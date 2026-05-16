// components/accounts/TransactionsList.tsx
'use client'

import { getCategoryIcon } from '@/lib/utils';
import { Transaction } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale'; // 💡 Importamos 'es' para fechas institucionales en español
import Link from 'next/link';
// 💡 Importamos el mapeador maestro de íconos

export default function TransactionsList({ 
  transactions, 
  emptyMessage 
}: { 
  transactions: Transaction[], 
  emptyMessage: string 
}) {
  if (transactions.length === 0) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center border border-dashed border-border rounded-[10px] bg-surface-2/30 mt-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // Agrupamos transacciones por fecha con formato CFO
  const groups = transactions.reduce((acc, tx) => {
    const date = new Date(tx.date);
    let label = '';
    
    if (isToday(date)) {
      label = `Hoy • ${format(date, 'dd MMM.', { locale: es })}`;
    } else if (isYesterday(date)) {
      label = `Ayer • ${format(date, 'dd MMM.', { locale: es })}`;
    } else {
      label = format(date, 'dd MMM. yyyy', { locale: es });
    }
    
    if (!acc[label]) acc[label] = [];
    acc[label].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([dateLabel, txs]) => (
        <div key={dateLabel} className="relative">
          {/* 💡 YBANK Style: Etiqueta de agrupación técnica */}
          <div className="sticky top-16 z-20 bg-background/95 backdrop-blur py-2 mb-2 border-b border-border">
            <h3 className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              {dateLabel}
            </h3>
          </div>
          
          <div className="space-y-1">
            {txs.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionItem({ tx }: { tx: Transaction }) {
  // 💡 Determinamos el tipo de forma segura
  const txType = tx.type || (tx.amount < 0 ? 'expense' : 'income');
  const isIncome = txType === 'income';
  
  return (
    // 💡 YBANK Style: Ahora es un Link clickeable que abre el modal de edición
    <Link 
      href={`?editTx=${tx.id}`}
      scroll={false}
      className="flex items-center justify-between p-3 rounded-[8px] hover:bg-surface-2 transition-colors cursor-pointer group border border-transparent hover:border-border"
    >
      <div className="flex items-center gap-3 min-w-0">
        
        {/* 💡 Ícono Dinámico conectado a la Base de Datos */}
        <div className={`p-2 rounded-[6px] border transition-colors bg-surface-2 shrink-0
            ${isIncome 
              ? 'border-border text-emerald-500 group-hover:bg-emerald-500/10' 
              : 'border-border text-rose-500 group-hover:bg-rose-500/10'}`}
        >
          {getCategoryIcon(tx.category?.icon)}
        </div>
        
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-xs font-bold text-foreground truncate">
            {tx.description || 'Operación Genérica'}
          </p>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 truncate">
            {tx.category?.name || 'SIN CLASIFICAR'} • {format(new Date(tx.date), 'HH:mm')}
          </p>
        </div>
      </div>

      <div className="text-right flex flex-col items-end shrink-0">
        <p className={`text-sm font-mono font-bold tracking-tight ${isIncome ? 'text-emerald-500' : 'text-foreground'}`}>
          {isIncome ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-[0.2em] mt-0.5">
          {tx.status === 'pending' ? 'PENDIENTE' : 'LIQUIDADO'}
        </span>
      </div>
    </Link>
  );
}