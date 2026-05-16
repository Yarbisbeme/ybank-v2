'use client';

import { useState } from 'react';
import { useUpdateSubTransaction } from '@/hooks/useCatalogs'; 
import { toast } from 'sonner';
import { Check, X, RefreshCw } from 'lucide-react';
import SearchableDropdown from '../ui/SearchableDropdown';

interface SubTransactionEditFormProps {
  item: any;
  categoryOptions: any[];
  onSave: () => void;
  onCancel: () => void;
}

export default function SubTransactionEditForm({ 
  item, 
  categoryOptions, 
  onSave, 
  onCancel 
}: SubTransactionEditFormProps) {
  
  const [name, setName] = useState(item.name || '');
  const [price, setPrice] = useState(item.unit_price?.toString() || '');
  const [categoryId, setCategoryId] = useState(item.category_id || '');
  
  const { mutate: updateItem, isPending: isSubmitting } = useUpdateSubTransaction();

  const handleSubmit = () => {
    if (!name || !price || !categoryId) {
      toast.error('Por favor completa todos los campos del ítem.');
      return;
    }

    updateItem(
      {
        itemId: item.id,
        input: {
          name,
          unit_price: parseFloat(price),
          quantity: 1, 
          category_id: categoryId
        }
      },
      {
        onSuccess: () => {
          onSave(); 
        }
      }
    );
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl shadow-sm animate-in fade-in zoom-in-95 duration-200">
      
      <div className="flex flex-col md:flex-row gap-2">
        <input 
          type="text" 
          placeholder="Descripción (ej. Carnes)" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50" 
        />
        <div className="relative w-full md:w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)}
            disabled={isSubmitting}
            className="w-full pl-7 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50" 
          />
        </div>
      </div>
      
      <div className={isSubmitting ? "opacity-50 pointer-events-none" : ""}>
        <SearchableDropdown 
          options={categoryOptions} 
          value={categoryId} 
          onChange={setCategoryId} 
          placeholder="Asignar categoría..." 
        />
      </div>

      <div className="flex justify-end gap-2 mt-1">
        <button 
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <X size={14} /> Cancelar
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm shadow-blue-600/20"
        >
          {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
      
    </div>
  );
}