'use client'

import { useEffect, useRef, useState } from 'react';
import { 
  ArrowDownRight, ArrowUpRight, ArrowRightLeft, Calendar, 
  Grid as GridIcon, CreditCard, AlignLeft, Send, Trash2,
  Info, CheckCircle2, RefreshCw, SplitSquareHorizontal, ChevronDown
} from 'lucide-react';
import { Account, Tag, Category } from '@/types'; 
import TagInput from './TagInput';
import SearchableDropdown from '../ui/SearchableDropdown';
import ExpenseSplitSection from './ExpenseSplitSection'; 
import { useSaveTransaction, useDeleteTransaction, useSaveTag } from '@/hooks/useCatalogs'; 
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
// 💡 Solo importamos el componente inteligente
import YBankCalendarPicker from '../filters/YBankCalendarPicker';

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

  // 💡 1. ESTADOS SIMPLIFICADOS (Adiós a los estados de coordenadas)
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarTriggerRef = useRef<HTMLDivElement>(null);
  
  const isEditing = !!initialData;
  const hasExistingSplit = isEditing && initialData?.type === 'expense' && initialData?.items && initialData.items.length > 0;
  
  const { mutate: createTagOptimistic } = useSaveTag();
  const { mutate: saveTx, isPending: isSubmitting } = useSaveTransaction();
  const { mutate: deleteTx, isPending: isDeleting } = useDeleteTransaction();
  
  const [type, setType] = useState<TransactionType>(getSafeType(initialData?.type));
  
  const initialAmount = initialData?.type === 'transfer' ? (initialData.target_amount || initialData.amount) : initialData?.amount;
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [accountId, setAccountId] = useState(initialData?.account_id || defaultAccountId || '');
  const [note, setNote] = useState(initialData?.description || initialData?.note || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(initialData?.transfer_to_account_id || '');

  const [isSplit, setIsSplit] = useState(initialData?.type === 'expense' && initialData?.items?.length > 0);
  const [items, setItems] = useState<any[]>(
    initialData?.type === 'expense' && initialData?.items?.length > 0 
    ? initialData.items.map((i: any) => ({ ...i, _id: crypto.randomUUID() })) 
    : [{ _id: crypto.randomUUID(), name: '', unit_price: '', quantity: 1, category_id: '' }]
  );

  const [date, setDate] = useState(initialData?.date ? initialData.date.split('T')[0].split(' ')[0] : new Date().toISOString().split('T')[0]);
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags?.map((t: any) => t.tag?.id) || []);

  useEffect(() => { if (type !== 'expense') setIsSplit(false); }, [type]);

  const accountOptions = (accounts || []).map(acc => ({ id: acc.id, label: acc.name, subLabel: acc.institution?.name || 'Banco' }));
  const activeCategories = (categories || []).filter(c => c.type === type);
  const categoryOptions = activeCategories.map(c => {
    const parentName = c.parent_id ? activeCategories.find(p => p.id === c.parent_id)?.name : 'Categoría Principal';
    return { id: c.id, label: c.name, subLabel: c.parent_id ? `Dentro de ${parentName}` : 'Categoría Principal' };
  });

  const handleCustomTagCreate = (newTagName: string) => {
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

    // 💡 1. Construimos el payload con camelCase (como espera tu backend)
    const payload: any = { 
      id: initialData?.id, 
      type, 
      accountId: accountId, 
      date, 
      note,                 // 👈 ¡Volvemos a usar 'note' como esperaba tu Server Action!
      tagIds: selectedTags  
    };

    if (!hasExistingSplit) {
      payload.amount = parseFloat(amount);
      
      if (type === 'transfer') {
        payload.destinationAccountId = destinationAccountId; // 👈 CORRECCIÓN VITAL
      } else {
        payload.categoryId = (type === 'expense' && isSplit) ? null : categoryId; // 👈 CORRECCIÓN VITAL
      }
      
      // 💡 2. Enriquecemos los items con la matemática completa para la BD
      payload.items = (type === 'expense' && isSplit) ? items.map(item => ({
        ...item,
        unit_price: parseFloat(item.unit_price),
        quantity: parseInt(item.quantity) || 1,
        total_price: parseFloat(item.unit_price) * (parseInt(item.quantity) || 1)
      })) : [];
    }

    saveTx(payload, { onSuccess: () => onSuccess() });
  };

  const handleDelete = () => {
    if (!initialData?.id) return;
    if (!window.confirm('ALERTA: ¿Confirmas la eliminación permanente de este registro contable?')) return;
    deleteTx(initialData.id, { onSuccess: () => onSuccess() });
  };

  const activeColor = type === 'expense' ? 'text-rose-600' : type === 'income' ? 'text-emerald-600' : 'text-primary';
  const activeBg = type === 'expense' ? 'bg-rose-600' : type === 'income' ? 'bg-emerald-600' : 'bg-primary';

  return (
    <div className="w-full bg-card rounded-[12px] border border-border shadow-sm flex flex-col font-sans relative overflow-visible">
      
      {/* TABS */}
      <div className="border-b border-border bg-surface-2/30">
        <div className="flex bg-surface-2 p-1.5 rounded-[6px] relative">
          {(['expense', 'income', 'transfer'] as const).map((t) => {
            const isActive = type === t;
            return (
              <button 
                key={t} type="button" disabled={hasExistingSplit} onClick={() => setType(t)} 
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors relative z-10 disabled:opacity-50",
                  isActive ? activeColor : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-background shadow-sm rounded-[4px] border border-border/50 -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
                {t === 'expense' ? <ArrowDownRight size={14} /> : t === 'income' ? <ArrowUpRight size={14} /> : <ArrowRightLeft size={14} />}
                <span>{t === 'expense' ? 'Salida' : t === 'income' ? 'Entrada' : 'Traspaso'}</span>
              </button>
            )
          })}
        </div>
      </div>

      <form id="tx-form" onSubmit={handleSubmit} className="flex flex-col gap-0 overflow-visible">
        <div className="flex flex-col p-4 gap-4">
          
          {/* HERO AMOUNT INPUT */}
          <div className="flex flex-col items-center justify-center py-4 px-4 rounded-[8px] bg-surface-2/30 border border-border/50 focus-within:border-primary/30 focus-within:bg-background transition-all">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
              {hasExistingSplit ? 'Monto Desglosado' : 'Importe Operativo'}
            </p>
            <div className="flex items-center text-4xl sm:text-5xl font-mono font-black text-foreground relative">
              <span className={cn("text-2xl sm:text-3xl mr-1.5 -mt-1 transition-colors", activeColor)}>$</span>
              <input 
                type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={handleAmountChange} disabled={hasExistingSplit} required 
                className={cn("w-full max-w-[280px] bg-transparent border-none outline-none text-center placeholder:text-muted-foreground/30 focus:ring-0 p-0 tracking-tighter disabled:opacity-60 transition-colors", amount ? "text-foreground" : "text-muted-foreground/30")}
                autoFocus={!isEditing} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* NODO ORIGEN */}
            <div className="group flex flex-col gap-1 p-2.5 rounded-[8px] border border-border/60 bg-surface-2/30 hover:bg-surface-2/50 focus-within:bg-background focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><CreditCard size={10} className="text-muted-foreground group-focus-within:text-primary transition-colors" />{type === 'transfer' ? 'Nodo Origen' : 'Nodo Operativo'}</label>
              <SearchableDropdown options={accountOptions} value={accountId} onChange={setAccountId} placeholder="Seleccionar Nodo..." />
            </div>

            {/* NODO DESTINO / CLASIFICACIÓN */}
            <div className="group flex flex-col gap-1 p-2.5 rounded-[8px] border border-border/60 bg-surface-2/30 hover:bg-surface-2/50 focus-within:bg-background focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              {hasExistingSplit ? (
                <div className="h-full flex items-center gap-2 p-1"><Info size={14} className="text-muted-foreground shrink-0" /><p className="text-[10px] font-medium text-muted-foreground leading-tight">Desglose activo.</p></div>
              ) : type === 'transfer' ? (
                <><label className="text-[9px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5"><Send size={10} /> Nodo Destino</label><SearchableDropdown options={accountOptions.filter(acc => acc.id !== accountId)} value={destinationAccountId} onChange={setDestinationAccountId} placeholder="Seleccionar Destino..." /></>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <label className={cn("text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors", isSplit ? "text-primary" : "text-muted-foreground")}><GridIcon size={10} className={isSplit ? "text-primary" : "text-emerald-500"} /> Clasificación</label>
                    {type === 'expense' && (
                      <button type="button" onClick={() => setIsSplit(!isSplit)} className="text-[9px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors bg-primary/10 px-1.5 py-0.5 rounded-[4px]"><SplitSquareHorizontal size={10} /> {isSplit ? 'Cerrar Desglose' : 'Desglosar Recibo'}</button>
                    )}
                  </div>
                  {!isSplit ? <SearchableDropdown options={categoryOptions} value={categoryId} onChange={setCategoryId} placeholder="Buscar categoría..." /> : <div className="flex-1 flex items-center px-2 py-1 mt-0.5 bg-primary/5 border border-primary/20 rounded-[4px]"><p className="text-[10px] font-medium text-primary/80">Modo desglose activo.</p></div>}
                </>
              )}
            </div>

            {/* 💡 FECHA VALOR: SUPER SIMPLE AHORA */}
            <div 
              ref={calendarTriggerRef}
              className="relative group flex flex-col justify-between p-2.5 h-[54px] rounded-[8px] border border-border/60 bg-surface-2/30 hover:bg-surface-2/50 focus-within:border-primary/40 transition-all cursor-pointer"
              onClick={() => setShowCalendar(true)}
            >
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5 cursor-pointer transition-colors group-hover:text-primary pointer-events-none">
                <Calendar size={10} /> Fecha Valor
              </label>
              
              <div className="flex items-center justify-between mb-0.5 pointer-events-none">
                <span className="text-[12px] font-mono font-bold text-foreground leading-none">
                  {format(new Date(date + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}
                </span>
                <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-200", showCalendar && "rotate-180")} />
              </div>
            </div>

            {/* ETIQUETAS Y NOTAS */}
            <div className="group flex flex-col gap-1 p-2.5 rounded-[8px] border border-border/60 bg-surface-2/30 hover:bg-surface-2/50 focus-within:bg-background focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
               <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">Etiquetas Analíticas</label>
               <TagInput availableTags={availableTags} selectedTagIds={selectedTags} onChange={setSelectedTags} onCustomTagCreate={handleCustomTagCreate} />
            </div>

            <div className="md:col-span-2 group flex flex-col gap-1 p-2.5 rounded-[8px] border border-border/60 bg-surface-2/30 hover:bg-surface-2/50 focus-within:bg-background focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><AlignLeft size={10} className="text-muted-foreground group-focus-within:text-primary transition-colors" /> Referencia / Glosa</label>
              <textarea rows={1} placeholder="Nota u observación contable..." className="w-full bg-transparent border-none outline-none text-xs text-foreground font-medium p-0 focus:ring-0 resize-none placeholder:text-muted-foreground/40" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        </div>

        {/* EXPANSION DE DESGLOSE */}
        <AnimatePresence>
          {type === 'expense' && isSplit && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="border-t border-border bg-surface-2/10 overflow-visible">
              <ExpenseSplitSection items={items} setItems={setItems} categoryOptions={categoryOptions} amount={amount} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACTION BAR */}
        <div className="sticky bottom-0 left-0 w-full flex items-center gap-3 p-4 pt-3 border-t border-border bg-background mt-auto z-[60] rounded-b-[12px]">
          {isEditing && (
            <button type="button" onClick={handleDelete} disabled={isSubmitting || isDeleting} className="px-3 py-2.5 rounded-[6px] bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors border border-transparent hover:border-destructive/20" title="Suprimir">
              {isDeleting ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />}
            </button>
          )}

          <button type="submit" form="tx-form" disabled={isSubmitting || isDeleting} className={cn("flex-1 py-2.5 rounded-[6px] text-xs font-bold uppercase tracking-widest text-white transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2", activeBg)}>
            {isSubmitting ? <><RefreshCw className="animate-spin" size={14} /> Procesando...</> : <><CheckCircle2 size={14} /> {isEditing ? 'Actualizar Ledger' : 'Asentar Operación'}</>}
          </button>
        </div>
      </form>

      {/* 💡 2. LLAMADA AL CALENDARIO INTELIGENTE */}
      <YBankCalendarPicker 
        isOpen={showCalendar} 
        mode="single"
        triggerRef={calendarTriggerRef}
        value={date} 
        onChange={(newDate) => { setDate(newDate); setShowCalendar(false); }} 
        onClose={() => setShowCalendar(false)} 
      />

    </div>
  );
}