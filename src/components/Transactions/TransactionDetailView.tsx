// src/components/Transactions/TransactionDetailView.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit2, ArrowDownCircle, ArrowUpCircle, RefreshCw, MapPin, Tag as TagIcon, AlignLeft } from 'lucide-react';
import SubTransactionEditForm from './SubTransactionEditForm';
import { AccountType } from '@/types';

interface TransactionDetailViewProps {
  transaction: any; 
  categories: any[];
  accounts: any[];
}

export default function TransactionDetailView({ transaction, categories, accounts }: TransactionDetailViewProps) {
  // 💡 Aquí guardamos cuál ítem se está editando (null significa que ninguno)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Aseguramos que los items existan
  const items = transaction.items || [];
  const isExpense = transaction.type === 'expense';
  const accountName = accounts.find(acc => acc.id === transaction.account_id)?.name || 'Cuenta General';

  return (
    <div className="flex flex-col bg-white">
      
      {/* === 1. CABECERA DEL RECIBO (Solo Lectura) === */}
      <div className="flex flex-col items-center justify-center p-6 border-b border-slate-100 bg-slate-50/50">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm
          ${isExpense ? 'bg-rose-100 text-rose-500' : transaction.type === 'income' ? 'bg-emerald-100 text-emerald-500' : 'bg-blue-100 text-blue-500'}`}
        >
          {isExpense ? <ArrowDownCircle size={28} /> : transaction.type === 'income' ? <ArrowUpCircle size={28} /> : <RefreshCw size={28} />}
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 text-center mb-1">
          {transaction.description || 'Transacción'}
        </h2>
        
        <p className="text-4xl font-black text-slate-900 tracking-tighter my-2">
          {isExpense ? '-' : '+'}${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>

        <p className="text-sm text-slate-500 font-medium capitalize">
          {format(new Date(transaction.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      {/* === 2. DETALLES EXTRA === */}
      <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-100">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cuenta</span>
          <span className="text-sm font-bold text-slate-700">{accountName || 'Cuenta General'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría</span>
          <span className="text-sm font-bold text-slate-700">{transaction.category?.name || 'Múltiples (Desglose)'}</span>
        </div>
        {transaction.note && (
          <div className="col-span-2 flex flex-col gap-1 mt-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><AlignLeft size={12}/> Nota</span>
            <span className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{transaction.note}</span>
          </div>
        )}
      </div>

      {/* === 3. LA LISTA DE SUB-TRANSACCIONES === */}
      {items.length > 0 && (
        <div className="p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
            Desglose de la compra
          </h3>
          
          <div className="flex flex-col gap-2">
            {items.map((item: any) => (
              <div key={item.id}>
                
                {/* 💡 LA MAGIA: Si este ítem es el que estamos editando, mostramos el Formulario */}
                {editingItemId === item.id ? (
                  <SubTransactionEditForm 
                    item={item} 
                    categoryOptions={categories.filter((c: any) => c.type === 'expense').map((c: any) => ({ id: c.id, label: c.name }))}
                    onCancel={() => setEditingItemId(null)} // Cierra el modo edición
                    onSave={() => setEditingItemId(null)}   // Cierra el modo edición tras guardar
                  />
                ) : (
                  
                  /* Si NO lo estamos editando, mostramos la fila normal */
                  <div className="flex justify-between items-center p-3 md:p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:border-blue-200 transition-all">
                    <div className="flex flex-col min-w-0 pr-4">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 truncate">{item.category?.name || 'Sin categoría'}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-black text-slate-700">
                        ${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      
                      {/* Botón de Editar */}
                      <button 
                        onClick={() => setEditingItemId(item.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-white shadow-sm border border-slate-100"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>

                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}