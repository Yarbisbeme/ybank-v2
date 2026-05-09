'use client'

import { useEffect, useRef, useState } from 'react';
import { 
  ArrowDownCircle, ArrowUpCircle, RefreshCw, Calendar, 
  Grid as GridIcon, CreditCard, AlignLeft, Send, Trash2,
  Info 
} from 'lucide-react';
import { Account, Tag, Category } from '@/types'; 
import TagInput from './TagInput';
import SearchableDropdown from '../ui/SearchableDropdown';
import ExpenseSplitSection from './ExpenseSplitSection'; 
import { useSaveTransaction, useDeleteTransaction, useSaveTag } from '@/hooks/useCatalogs'; 
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type TransactionType = 'expense' | 'income' | 'transfer';

interface TransactionFormProps {
  accounts: Account[];
  tags: Tag[]; 
  categories: Category[];
  initialData?: any; 
  defaultAccountId?: string | null; 
  onSuccess: () => void; 
}

const getSafeType = (rawType?: string): TransactionType => {
  const t = String(rawType || '').toLowerCase().trim();
  if (t === 'ingreso' || t === 'income') return 'income';
  if (t === 'transferencia' || t === 'transfer') return 'transfer';
  return 'expense'; 
};

export default function TransactionForm({ accounts, tags, categories, initialData, defaultAccountId, onSuccess }: TransactionFormProps) {

  const dateInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!initialData;
  const hasExistingSplit = isEditing && initialData?.type === 'expense' && initialData?.items && initialData.items.length > 0;
  const { mutate: createTagOptimistic } = useSaveTag();
  const { mutate: saveTx, isPending: isSubmitting } = useSaveTransaction();
  const { mutate: deleteTx, isPending: isDeleting } = useDeleteTransaction();
  
  const [type, setType] = useState<TransactionType>(getSafeType(initialData?.type));
  
  const initialAmount = initialData?.type === 'transfer' 
    ? (initialData.target_amount || initialData.amount) 
    : initialData?.amount;
    
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [accountId, setAccountId] = useState(initialData?.account_id || defaultAccountId || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(initialData?.transfer_to_account_id || '');

  const [isSplit, setIsSplit] = useState(initialData?.type === 'expense' && initialData?.items?.length > 0);
  const [items, setItems] = useState<any[]>(
    initialData?.type === 'expense' && initialData?.items?.length > 0 
    ? initialData.items.map((i: any) => ({ ...i, _id: crypto.randomUUID() })) 
    : [{ _id: crypto.randomUUID(), name: '', unit_price: '', quantity: 1, category_id: '' }]
  );

  const [date, setDate] = useState(
    initialData?.date 
    ? initialData.date.split('T')[0].split(' ')[0] 
    : new Date().toISOString().split('T')[0]
  );
  
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags?.map((t: any) => t.tag?.id) || []
  );

  useEffect(() => {
    if (type !== 'expense') setIsSplit(false);
  }, [type]);

  const accountOptions = (accounts || []).map(acc => ({ id: acc.id, label: acc.name, subLabel: acc.institution?.name || 'Banco' }));
  const activeCategories = (categories || []).filter(c => c.type === type);
  const categoryOptions = activeCategories.map(c => {
    const parentName = c.parent_id ? activeCategories.find(p => p.id === c.parent_id)?.name : 'Categoría Principal';
    return { id: c.id, label: c.name, subLabel: c.parent_id ? `Dentro de ${parentName}` : 'Categoría Principal' };
  });

  const handleCustomTagCreate = (newTagName: string) => {
    // Disparamos la mutación hacia Supabase
    createTagOptimistic(newTagName, {
      onSuccess: (response) => {
        setSelectedTags(prev => [...prev, response.data.id]);
        setAvailableTags(prev => [...prev, response.data]); 
      }
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!hasExistingSplit && type === 'expense' && isSplit) {
      const splitTotal = items.reduce((sum, item) => sum + Number(item.unit_price || 0), 0);
      if (Math.abs(splitTotal - Number(amount)) > 0.01) { 
        toast.error('La suma del desglose no coincide con el monto total.');
        return;
      }
      if (items.some(item => !item.category_id)) {
        toast.error('Todas las sub-transacciones deben tener una categoría.');
        return;
      }
    }

    const payload: any = { 
      id: initialData?.id, 
      type, 
      account_id: accountId, 
      date, 
      note, 
      tags: selectedTags 
    };

    if (!hasExistingSplit) {
      payload.amount = amount;
      if (type === 'transfer') {
        payload.transfer_to_account_id = destinationAccountId; 
      } else {
        payload.category_id = (type === 'expense' && isSplit) ? null : categoryId;
      }
      payload.items = (type === 'expense' && isSplit) ? items : [];
    }

    // 💡 3. Disparamos la mutación. TanStack Query se encarga del resto.
    saveTx(payload, {
      onSuccess: () => {
        // Al tener éxito (incluso optimista), cerramos el modal al instante.
        onSuccess();
      }
    });
  };

  const handleDelete = () => {
    if (!initialData?.id) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta transacción completa, incluyendo todo su desglose?')) return;
    
    deleteTx(initialData.id, {
      onSuccess: () => {
        onSuccess();
      }
    });
  };

  return (
    <div className="w-full bg-white rounded-3xl overflow-hidden pb-4">
      
      {/* SELECTOR DE TIPO */}
      <div className="flex p-2 bg-slate-50 border-b border-slate-100">
        <button type="button" disabled={hasExistingSplit} onClick={() => setType('expense')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ArrowDownCircle size={18} /> Gasto</button>
        <button type="button" disabled={hasExistingSplit} onClick={() => setType('income')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ArrowUpCircle size={18} /> Ingreso</button>
        <button type="button" disabled={hasExistingSplit} onClick={() => setType('transfer')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${type === 'transfer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><RefreshCw size={18} /> Transferir</button>
      </div>

      <form id="tx-form" onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
        
        {/* INPUT DE MONTO */}
        <div className="flex flex-col items-center justify-center py-2">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            {hasExistingSplit ? 'Monto Total Desglosado' : `Monto a ${type === 'transfer' ? 'transferir' : 'registrar'}`}
          </p>
          <div className="flex items-center text-5xl font-black text-slate-800 relative">
            <span className={`text-3xl mr-1 ${type === 'expense' ? 'text-rose-500' : type === 'income' ? 'text-emerald-500' : 'text-blue-500'}`}>$</span>
            <input 
              type="text" 
              inputMode="decimal" 
              placeholder="0.00" 
              value={amount} 
              onChange={handleAmountChange} 
              disabled={hasExistingSplit}
              required 
              className="w-full max-w-[300px] bg-transparent border-none outline-none text-center placeholder:text-slate-200 focus:ring-0 p-0 tracking-tighter disabled:opacity-60 disabled:cursor-not-allowed" 
              autoFocus={!isEditing} 
            />
          </div>
          
          {type === 'transfer' && Number(amount) > 0 && (
            <motion.div initial={{opacity: 0, y: -5}} animate={{opacity: 1, y: 0}} className="mt-3 flex flex-col items-center">
               <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
                 + ${ (Number(amount) * 0.0015).toLocaleString('en-US', { minimumFractionDigits: 2 }) } DOP (Comisión DGII 0.15% Auto)
               </span>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-blue-500 transition-all">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500"><CreditCard size={18} /></div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{type === 'transfer' ? 'Desde Cuenta' : 'Cuenta'}</label>
              <SearchableDropdown options={accountOptions} value={accountId} onChange={setAccountId} placeholder="Buscar cuenta..." />
            </div>
          </div>

          {hasExistingSplit ? (
            <div className="col-span-1 md:col-span-2 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3">
              <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 font-medium leading-relaxed">
                Esta transacción tiene sub-categorías. Puedes modificar la cuenta, la fecha y las notas aquí. Para editar montos y categorías, utiliza la vista de detalles.
              </p>
            </div>
          ) : type === 'transfer' ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-blue-200 bg-blue-50/30 focus-within:border-blue-500 transition-all">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-500"><Send size={18} /></div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">Hacia Cuenta</label>
                <SearchableDropdown options={accountOptions.filter(acc => acc.id !== accountId)} value={destinationAccountId} onChange={setDestinationAccountId} placeholder="Buscar destino..." />
              </div>
            </div>
          ) : type === 'income' ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-blue-500 transition-all">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500"><GridIcon size={18} /></div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Categoría</label>
                <SearchableDropdown options={categoryOptions} value={categoryId} onChange={setCategoryId} placeholder="Buscar categoría..." />
              </div>
            </div>
          ) : (
            <ExpenseSplitSection 
              isSplit={isSplit} setIsSplit={setIsSplit} 
              categoryId={categoryId} setCategoryId={setCategoryId} 
              items={items} setItems={setItems} 
              categoryOptions={categoryOptions} amount={amount} 
            />
          )}

          <div onClick={() => dateInputRef.current?.showPicker()} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all cursor-pointer">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500"><Calendar size={18} /></div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5 cursor-pointer">Fecha</label>
              <input ref={dateInputRef} type="date" className="w-full bg-transparent border-none outline-none text-sm text-slate-800 font-bold p-0 focus:ring-0 cursor-pointer" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="col-span-1 md:col-span-1 flex flex-col justify-center">
             <TagInput availableTags={availableTags} selectedTagIds={selectedTags} onChange={setSelectedTags} onCustomTagCreate={handleCustomTagCreate} />
          </div>

          <div className="col-span-1 md:col-span-2 flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-blue-500 transition-all">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 mt-0.5"><AlignLeft size={18} /></div>
            <div className="flex-1">
              <textarea rows={1} placeholder="Nota o descripción (Opcional)" className="w-full bg-transparent border-none outline-none text-sm text-slate-700 font-medium p-0 focus:ring-0 resize-none pt-1.5" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center gap-3 mt-2">
          {isEditing && (
            <button type="button" onClick={handleDelete} disabled={isSubmitting || isDeleting} className="p-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50">
              {isDeleting ? <RefreshCw className="animate-spin" size={20} /> : <Trash2 size={20} />}
            </button>
          )}
          <button type="submit" form="tx-form" disabled={isSubmitting || isDeleting} className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}>
            {isSubmitting ? <div className="flex items-center justify-center gap-2"><RefreshCw className="animate-spin" size={18} />Procesando...</div> : `${isEditing ? 'Actualizar Detalles' : 'Guardar'} ${type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Transferencia'}`}
          </button>
        </div>
      </form>
    </div>
  );
}