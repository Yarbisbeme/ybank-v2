"use client";

import React from 'react';
import { Transaction } from '@/types'; 
import { Download, Filter } from 'lucide-react';
import { getCategoryIcon, getTransactionStyles } from '@/lib/utils';

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options); 
  };

  // 💡 NUEVO: Control total sobre cómo se ve el monto según el tipo
  const getAmountDisplay = (type: string, amount: number) => {
    const absAmount = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
    
    switch (type.toLowerCase()) {
      case 'income':
        return { color: 'text-emerald-500', text: `+$${absAmount}` };
      case 'expense':
        return { color: 'text-slate-800', text: `-$${absAmount}` };
      case 'transfer':
      default:
        // Las transferencias usan un gris neutral y no llevan símbolo de suma o resta
        return { color: 'text-slate-500', text: `$${absAmount}` };
    }
  };

  return (
    <div className="w-full">
      {/* ENCABEZADO SUPERIOR CON BOTONES */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h3>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200">
            <Filter size={18} strokeWidth={2.5} />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200">
            <Download size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      {/* CONTENEDOR DE LA TABLA */}
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
            
            // 💡 Usamos la nueva función para obtener el color y texto exacto del monto
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
                  {/* 💡 SOLUCIÓN DEL ICONO: Quitamos el styles.iconColor y aplicamos style={{ color: rawColor }} */}
                  <div 
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-slate-100/80"
                    style={{ color: rawColor }}
                  >
                    {CategoryIcon}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {tx.description} 
                    </p>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                      {formatDate(tx.date)}
                    </p>
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

                {/* 4. MONTO (Desktop) */}
                <div className="hidden lg:flex lg:col-span-2 items-center justify-end">
                  {/* 💡 Aplicamos el color dinámico devuelto por getAmountDisplay */}
                  <p className={`text-[15px] font-black tracking-tight ${amountDisplay.color}`}>
                    {amountDisplay.text}
                  </p>
                </div>

                {/* VISTA MÓVIL DEL MONTO Y CATEGORÍA */}
                <div className="flex md:hidden items-center justify-between mt-1 pt-3 border-t border-slate-100/50">
                  <div className="inline-flex items-center px-2 py-0.5 rounded" style={pillStyle}>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest">
                      {categoryName}
                    </span>
                  </div>
                  {/* 💡 Aplicamos el color dinámico devuelto por getAmountDisplay en móvil */}
                  <p className={`text-sm font-black tracking-tight ${amountDisplay.color}`}>
                    {amountDisplay.text}
                  </p>
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