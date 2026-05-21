'use client'

import { useState } from 'react';
import { CreateAccountInput, EditCreateAccount, Institution } from '@/types'; 
import { createAccount, updateAccount } from '@/lib/actions/accounts'; 
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import NodeConfigModal from './EditableUniversalCard';
import EditableUniversalCard from './EditableUniversalCard';
import AccountDetailsPanel from './AccountDetailsPanel';
import { CheckCircle2, Power, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const emptyInstitution: Institution = {
  id: '', name: '', logo_url: null, exchange_rate_adjustment: 0, exchange_rate_buy_adjustment: 0, created_at: new Date().toISOString(), brand_color_primary: '#1e3a8a'
};

export default function AccountFormWrapper({ 
  initialData,
  institutions,
  onSuccess
}: {
  initialData?: EditCreateAccount;
  institutions: Institution[];
  onSuccess?: () => void;
}) {
  const isEditing = !!initialData?.id;
  const router = useRouter(); 
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [accountData, setAccountData] = useState<EditCreateAccount>(() => {
    if (initialData) {
      return {
        ...initialData,
        color: initialData.color || initialData.institution?.brand_color_primary || '#09090b',
        custom_pattern: initialData.custom_pattern || initialData.institution?.card_pattern || 'geometric',
        custom_text_theme: initialData.custom_text_theme || initialData.institution?.text_theme || 'light',
      };
    }
    return {
      name: '', type: 'checking', currency: 'DOP',
      color: '#09090b', custom_pattern: 'geometric', custom_text_theme: 'light',
      current_balance: 0, last_4_digits: '',
      institution: emptyInstitution, is_active: true, initial_balance: 0
    };
  });

  const handleChange = (field: keyof EditCreateAccount, value: any) => {
    setAccountData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    if (!accountData.name.trim()) return toast.error('El nombre del nodo es obligatorio.');
    if (accountData.type !== 'cash' && (!accountData.institution?.id && !accountData.institution_id)) 
        return toast.error('Selecciona una institución financiera.');

    setIsSubmitting(true);
    try {
      const inputData = {
        name: accountData.name, type: accountData.type, currency: accountData.currency,
        initial_balance: accountData.initial_balance ?? 0, 
        institution_id: accountData.institution_id || accountData.institution?.id || '', 
        last_4_digits: accountData.last_4_digits || undefined,
        credit_limit: accountData.credit_limit || undefined,
        is_active: accountData.is_active ?? true,
      };

      const result = (isEditing && accountData.id) ? await updateAccount(accountData.id, inputData) : await createAccount(inputData);

      if (result?.success) {
        toast.success(isEditing ? 'Configuración actualizada' : 'Nodo creado con éxito');
        onSuccess?.();
        router.refresh(); 
      } else {
        throw new Error(result?.error || 'Error al guardar');
      }
    } catch (error: any) {
      toast.error(error.message);
      setIsSubmitting(false);
    } 
  };

  return (
    <div className="w-full h-full p-4 md:p-6 flex flex-col gap-8"> 
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"> 
  
        <div className="lg:col-span-6 w-full">
          {/* Limitamos el max-w para que la tarjeta no se vea como un banner gigante */}
          <div className="max-w-[400px] mx-auto"> 
            <EditableUniversalCard data={accountData} onChange={handleChange} institutions={institutions} />
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col w-full">
          <AccountDetailsPanel data={accountData} onChange={handleChange} isEditing={isEditing} />
        </div>
      </div>
      
      <div className="border-t border-border pt-8 mt-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
  
        {isEditing ? (
          <div className="flex items-center justify-between w-full p-4 bg-surface-2 border border-border rounded-[12px]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background border border-border rounded-[8px] text-primary">
                <Power size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Cuenta Activa</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Visible en reportes.</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => handleChange('is_active', !accountData.is_active)}
              className={cn(
                "w-11 h-6 rounded-full transition-all duration-300 relative border border-black/5", 
                accountData.is_active ? 'bg-primary' : 'bg-slate-300'
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm", 
                accountData.is_active ? 'left-5.5 translate-x-0' : 'left-0.5'
              )} />
            </button>
          </div>
        ) : (
          <div /> 
        )}

        <button 
          onClick={handleSave}
          disabled={isSubmitting}
          className={cn(
            "w-full flex items-center h-full justify-center gap-2 px-8 py-4 rounded-[12px] text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg",
            isSubmitting 
              ? "bg-muted text-muted-foreground cursor-wait" 
              : "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          {isSubmitting ? (
            <><RefreshCw className="animate-spin" size={14} /> Procesando...</>
          ) : (
            <><CheckCircle2 size={16} /> {isEditing ? 'Guardar Configuración' : 'Confirmar y Crear'}</>
          )}
        </button>
      </div>
    </div>
  );
}