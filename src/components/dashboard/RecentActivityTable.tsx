"use client";

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; 
import { Transaction } from '@/types'; 
import { getCategoryIcon } from '@/lib/utils';
import { Edit2 } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleEdit = (transactionId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('editTx', transactionId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // 💡 SOLUCIÓN APLICADA: Forzamos la zona horaria a UTC para que la fecha no cambie
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      timeZone: 'UTC' // Este pequeño parámetro evita el viaje en el tiempo 🕰️
    };
    return new Date(dateString).toLocaleDateString('en-US', options); 
  };

  const getAmountDisplay = (type: string, amount: number) => {
    const absAmount = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
    
    switch (type.toLowerCase()) {
      case 'income':
        return { color: 'text-emerald-500', text: `+$${absAmount}` };
      case 'expense':
        return { color: 'text-slate-800', text: `-$${absAmount}` };
      case 'transfer':
      default:
        return { color: 'text-slate-500', text: `$${absAmount}` };
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        
        {/* ENCABEZADOS DE TABLA */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100/80">
          <div className="col-span-6 lg:col-span-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Entity / Date</div>
          <div className="col-span-3 lg:col-span-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Category</div>
          <div className="col-span-3 lg:col-span-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Account</div>
          <div className="hidden lg:block lg:col-span-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</div>
        </div>

        {/* LISTA DE TRANSACCIONES */}
        <div className="divide-y divide-slate-100/80">
          {transactions.map((tx) => {
            const categoryName = tx.category?.name || 'General';
            const rawColor = tx.category?.color || (tx.category as any)?.parent?.color || '#94a3b8'; 
            
            const CategoryIcon = getCategoryIcon(tx.category?.icon);
            const amountDisplay = getAmountDisplay(tx.type, tx.amount);
            
            const pillStyle = {
              color: rawColor,
              backgroundColor: `${rawColor}15`, 
            };

            return (
              <div 
                key={tx.id} 
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-4 md:px-8 py-4 md:py-5 hover:bg-slate-50/50 transition-colors group cursor-pointer"
              >
                {/* 1. ENTIDAD Y FECHA */}
                <div className="col-span-1 md:col-span-6 lg:col-span-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-slate-100/80" style={{ color: rawColor }}>
                    {CategoryIcon}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 truncate">{tx.description}</p>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5">{formatDate(tx.date)}</p>
                  </div>
                </div>

                {/* 2. CATEGORÍA */}
                <div className="hidden md:flex col-span-3 lg:col-span-3 items-center">
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md" style={pillStyle}>
                    <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-widest truncate">
                      {categoryName}
                    </span>
                  </div>
                </div>

                {/* 3. CUENTA ASOCIADA */}
                <div className="hidden md:flex col-span-3 lg:col-span-2 items-center">
                   <p className="text-sm font-medium text-slate-500 truncate">
                     {tx.account?.name || 'Main Account'}
                   </p>
                </div>

                {/* 4. MONTO Y BOTÓN DE EDITAR (Desktop) */}
                <div className="hidden lg:flex lg:col-span-2 items-center justify-end gap-2">
                  <p className={`text-[15px] font-black tracking-tight ${amountDisplay.color}`}>
                    {amountDisplay.text}
                  </p>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // 💡 Evita que se disparen otros eventos click si los agregas a la fila después
                        handleEdit(tx.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Editar transacción"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>

                {/* VISTA MÓVIL DEL MONTO, CATEGORÍA Y BOTÓN */}
                <div className="flex md:hidden items-center justify-between mt-1 pt-3 border-t border-slate-100/50">
                  <div className="inline-flex items-center px-2 py-0.5 rounded" style={pillStyle}>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest">{categoryName}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-black tracking-tight ${amountDisplay.color}`}>
                      {amountDisplay.text}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // 💡 Buena práctica para móviles también
                        handleEdit(tx.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-full"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
          
          {(!transactions || transactions.length === 0) && (
            <div className="p-12 text-center text-slate-500 font-medium text-sm">
              No recent transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}