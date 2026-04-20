'use client'

import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Calendar, Grid as GridIcon, CreditCard, AlignLeft, Send } from 'lucide-react';
import { Account, Tag } from '@/types'; 
import TagInput from './TagInput';

type TransactionType = 'expense' | 'income' | 'transfer';

// 💡 1. Agregamos la interfaz de la Categoría basada en tu JSON
export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  type: 'expense' | 'income';
  icon?: string;
}

interface TransactionFormProps {
  accounts: Account[];
  tags: Tag[]; 
  categories: Category[]; // 💡 Recibimos las categorías de la BD
  initialData?: any; 
  onSuccess?: () => void;
}

export default function TransactionForm({ accounts, tags, categories, initialData, onSuccess }: TransactionFormProps) {
  const isEditing = !!initialData;
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [accountId, setAccountId] = useState(initialData?.accountId || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(initialData?.note || '');
  
  // Estados específicos
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [destinationAccountId, setDestinationAccountId] = useState(initialData?.destinationAccountId || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tagIds || []);
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags || []);

  // 💡 2. LÓGICA DE CATEGORÍAS: Filtramos por tipo y agrupamos (Padre -> Hijas)
  const activeCategories = (categories || []).filter(c => c.type === type);
  const parentCategories = activeCategories.filter(c => c.parent_id === null);
  
  const groupedCategories = parentCategories.map(parent => ({
    ...parent,
    children: activeCategories.filter(c => c.parent_id === parent.id)
  }));

  const handleCustomTagCreate = async (newTagName: string) => {
    const tempId = `temp-${Date.now()}`;
    const newTag = { id: tempId, name: newTagName } as Tag;
    setAvailableTags(prev => [...prev, newTag]);
    setSelectedTags(prev => [...prev, tempId]);
    // Aquí iría tu llamada a BD...
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      type, amount, accountId, date, note, tagIds: selectedTags,
      ...(type === 'transfer' ? { destinationAccountId } : { categoryId })
    };
    console.log('Guardando:', payload);
    if (onSuccess) onSuccess();
  };

  return (
    // 💡 Quitamos el max-w-md para que el modal decida el ancho
    <div className="w-full bg-white rounded-3xl overflow-hidden">
      
      {/* TABS DE TIPO */}
      <div className="flex p-2 bg-slate-50 border-b border-slate-100">
        <button type="button" onClick={() => setType('expense')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ArrowDownCircle size={18} /> Gasto</button>
        <button type="button" onClick={() => setType('income')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ArrowUpCircle size={18} /> Ingreso</button>
        <button type="button" onClick={() => setType('transfer')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${type === 'transfer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><RefreshCw size={18} /> Transferir</button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
        
        {/* MONTO (Más compacto) */}
        <div className="flex flex-col items-center justify-center py-2">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Monto a {type === 'transfer' ? 'transferir' : 'registrar'}</p>
          <div className="flex items-center text-5xl font-black text-slate-800">
            <span className={`text-3xl mr-1 ${type === 'expense' ? 'text-rose-500' : type === 'income' ? 'text-emerald-500' : 'text-blue-500'}`}>$</span>
            <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full max-w-[200px] bg-transparent border-none outline-none text-center placeholder:text-slate-200 focus:ring-0 p-0 tracking-tighter" autoFocus={!isEditing} />
          </div>
        </div>

        {/* 💡 3. GRID LAYOUT: Ponemos elementos lado a lado en pantallas medianas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* CUENTA ORIGEN (Siempre visible) */}
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-blue-500 transition-all">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500"><CreditCard size={18} /></div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {type === 'transfer' ? 'Desde Cuenta' : 'Cuenta'}
              </label>
              <select className="w-full bg-transparent border-none outline-none text-sm text-slate-700 font-bold p-0 focus:ring-0 truncate" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                <option value="" disabled>Seleccionar...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.institution?.name || 'Banco'} - {acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 💡 4. RENDERIZADO CONDICIONAL (Destino vs Categoría) */}
          {type === 'transfer' ? (
            /* CUENTA DESTINO */
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-blue-200 bg-blue-50/30 focus-within:border-blue-500 transition-all">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-500"><Send size={18} /></div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Hacia Cuenta</label>
                <select className="w-full bg-transparent border-none outline-none text-sm text-slate-700 font-bold p-0 focus:ring-0 truncate" value={destinationAccountId} onChange={(e) => setDestinationAccountId(e.target.value)} required>
                  <option value="" disabled>Seleccionar destino...</option>
                  {accounts
                    .filter(acc => acc.id !== accountId) // No puedes transferir a la misma cuenta
                    .map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.institution?.name || 'Banco'} - {acc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* CATEGORÍA AGRUPADA (Solo Gastos e Ingresos) */
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-blue-500 transition-all">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500"><GridIcon size={18} /></div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                <select className="w-full bg-transparent border-none outline-none text-sm text-slate-700 font-bold p-0 focus:ring-0 truncate" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="" disabled>Elegir...</option>
                  {groupedCategories.map(parent => (
                    <optgroup key={parent.id} label={parent.name.toUpperCase()}>
                      <option value={parent.id}>{parent.name} (General)</option>
                      {parent.children.map(child => (
                        <option key={child.id} value={child.id}>↳ {child.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* FECHA Y TAGS LADO A LADO */}
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-blue-500 transition-all">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500"><Calendar size={18} /></div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</label>
              <input type="date" className="w-full bg-transparent border-none outline-none text-sm text-slate-700 font-bold p-0 focus:ring-0" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="col-span-1 md:col-span-1 flex flex-col justify-center">
             <TagInput availableTags={availableTags} selectedTagIds={selectedTags} onChange={setSelectedTags} onCustomTagCreate={handleCustomTagCreate} />
          </div>

          {/* NOTA (Ancho completo) */}
          <div className="col-span-1 md:col-span-2 flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-blue-500 transition-all">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 mt-0.5"><AlignLeft size={18} /></div>
            <div className="flex-1">
              <textarea rows={1} placeholder="Nota o descripción (Opcional)" className="w-full bg-transparent border-none outline-none text-sm text-slate-700 font-medium p-0 focus:ring-0 resize-none pt-1.5" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        </div>

        {/* BOTÓN */}
        <button type="submit" className={`w-full py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-[0.98] ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}>
          {isEditing ? 'Actualizar' : 'Guardar'} {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Transferencia'}
        </button>
        
      </form>
    </div>
  );
}