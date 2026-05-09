'use client';

import { useState } from 'react';
import { Edit2, ArrowDownCircle, ArrowUpCircle, RefreshCw, AlignLeft } from 'lucide-react';


export default function TransactionDetailView({ 
  transaction, 
  categories, 
  accounts,
  onEditRequest 
}: any) {
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const items = transaction.items || [];
  const isExpense = transaction.type === 'expense';
  const accountName = accounts.find((acc: any) => acc.id === transaction.account_id)?.name || 'Cuenta General';

  return (
    <div className="flex flex-col bg-white">
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

        {/* Botón de Edición Principal: Solo llama a onEditRequest */}
        <button 
          onClick={onEditRequest}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Edit2 size={14} />
          Editar Detalles {transaction.type === 'transfer' ? 'y Monto' : ''}
        </button>
      </div>

      {/* ... resto de tu código de detalles (Cuenta, Notas, etc.) ... */}
      <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-100">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cuenta</span>
          <span className="text-sm font-bold text-slate-700">{accountName || 'Cuenta General'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría</span>
          <span className="text-sm font-bold text-slate-700">{transaction.category?.name || 'Múltiples (Desglose)'}</span>
        </div>
      </div>

      {/* ... LA LISTA DE SUB-TRANSACCIONES ... */}
      <div className="p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Desglose Contable</h3>
          <div className="flex flex-col gap-2">
            {items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center p-3 md:p-4 bg-slate-50 border border-slate-100 rounded-xl group transition-all">
                <div className="flex flex-col min-w-0 pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 truncate">{item.category?.name || 'Sin categoría'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-slate-700">
                    ${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  
                  {/* Candado para transferencias en ítems individuales */}
                  {transaction.type !== 'transfer' && (
                    <button 
                      onClick={() => setEditingItemId(item.id)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-white shadow-sm border border-slate-100"
                    >
                      <Edit2 size={16} />
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