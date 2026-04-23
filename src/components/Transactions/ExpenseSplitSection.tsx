'use client'

import { Plus, X, Grid as GridIcon } from 'lucide-react';
import SearchableDropdown from '../ui/SearchableDropdown';

interface ExpenseSplitSectionProps {
  isSplit: boolean;
  setIsSplit: (val: boolean) => void;
  categoryId: string;
  setCategoryId: (val: string) => void;
  items: any[];
  setItems: (items: any[]) => void;
  categoryOptions: any[];
  amount: string;
}

export default function ExpenseSplitSection({
  isSplit, setIsSplit,
  categoryId, setCategoryId,
  items, setItems,
  categoryOptions, amount
}: ExpenseSplitSectionProps) {

  const addItem = () => {
    setItems([...items, { _id: crypto.randomUUID(), name: '', unit_price: '', quantity: 1, category_id: '' }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalSplit = items.reduce((sum, i) => sum + Number(i.unit_price || 0), 0);
  const isTotalCorrect = totalSplit === Number(amount || 0);

  return (
    <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
      {/* CONTROL DE FORMATO */}
      <div className="flex items-center justify-between p-1 mb-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Formato del Gasto
        </label>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            type="button" onClick={() => setIsSplit(false)} 
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${!isSplit ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Simple
          </button>
          <button 
            type="button" onClick={() => setIsSplit(true)} 
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${isSplit ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Desglosado
          </button>
        </div>
      </div>

      {/* CONTENIDO SEGÚN EL FORMATO */}
      {!isSplit ? (
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-blue-500 transition-all">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500"><GridIcon size={18} /></div>
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Categoría</label>
            <SearchableDropdown options={categoryOptions} value={categoryId} onChange={setCategoryId} placeholder="Buscar categoría general..." />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50/30 transition-all">
          {items.map((item, index) => (
            <div key={item._id} className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)} className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 rounded-full p-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 hover:bg-rose-200">
                  <X size={14} />
                </button>
              )}
              <div className="flex flex-col md:flex-row gap-2">
                {/* 💡 FIX: Añadimos text-slate-900 y placeholder:text-slate-400 */}
                <input 
                  type="text" placeholder="Descripción (ej. Carnes)" value={item.name} 
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 outline-none" required
                />
                <div className="relative w-full md:w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  {/* 💡 FIX: Añadimos text-slate-900 y placeholder:text-slate-400 */}
                  <input 
                    type="number" step="0.01" placeholder="0.00" value={item.unit_price} 
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    className="w-full pl-7 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 outline-none" required
                  />
                </div>
              </div>
              <SearchableDropdown options={categoryOptions} value={item.category_id} onChange={(val) => updateItem(index, 'category_id', val)} placeholder="Asignar categoría a este ítem..." />
            </div>
          ))}
          
          <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-500 rounded-xl text-sm font-bold hover:border-blue-400 hover:bg-blue-100/50 transition-all flex items-center justify-center gap-2 mt-2">
            <Plus size={16} /> Añadir otro ítem
          </button>
          
          <div className="flex justify-between items-center text-xs px-2 mt-3 pt-3 border-t border-blue-100">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Total desglosado:</span>
            <span className={`text-base font-black ${isTotalCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
              ${totalSplit.toFixed(2)} <span className="text-slate-400 text-xs">/ ${Number(amount || 0).toFixed(2)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}