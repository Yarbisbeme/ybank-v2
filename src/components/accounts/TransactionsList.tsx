// components/accounts/TransactionsList.tsx
'use client'

import { Transaction } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { ShoppingBag, Coffee, Utensils, Zap, Repeat, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function TransactionsList({ 
  transactions, 
  emptyMessage 
}: { 
  transactions: Transaction[], 
  emptyMessage: string 
}) {
  if (transactions.length === 0) {
    return <div className="p-10 text-center text-slate-400 font-medium">{emptyMessage}</div>;
  }

  // Agrupamos transacciones por fecha
  const groups = transactions.reduce((acc, tx) => {
    const date = new Date(tx.date);
    const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMMM dd, yyyy');
    if (!acc[label]) acc[label] = [];
    acc[label].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="divide-y divide-slate-50">
      {Object.entries(groups).map(([dateLabel, txs]) => (
        <div key={dateLabel} className="p-4">
          <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 ml-2">
            {dateLabel}
          </h3>
          <div className="space-y-4">
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
  const isIncome = tx.amount > 0;
  
  return (
    <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        {/* Icono de Categoría Dinámico */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-900'}`}>
          {isIncome ? <ArrowDownLeft size={20} /> : <ShoppingBag size={20} />}
        </div>
        
        <div>
          <p className="text-sm font-bold text-slate-900 truncate max-w-[150px] md:max-w-xs">
            {tx.description}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {tx.category?.name || 'General'} • {format(new Date(tx.date), 'h:mm b')}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className={`text-sm font-black tracking-tight ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
          {isIncome ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest">
          {tx.status || 'Cleared'}
        </span>
      </div>
    </div>
  );
}