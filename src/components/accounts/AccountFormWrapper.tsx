'use client'

import { useState } from 'react';
import EditableUniversalCard from './EditableUniversalCard';
import { EditCreateAccount, Institution } from '@/types'; 
import { Power, Loader2, ShieldAlert } from 'lucide-react';
import { createAccount, updateAccount } from '@/lib/actions/accounts'; 
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

  const [accountData, setAccountData] = useState<EditCreateAccount>(
    initialData || {
      name: '',
      type: 'checking',
      currency: 'DOP',
      color: '#0f172a',
      custom_pattern: 'geometric',
      custom_text_theme: 'light',
      current_balance: 0,
      last_4_digits: '',
      institution: emptyInstitution,
      is_active: true,
      initial_balance: 0
    }
  );

  const handleChange = (field: keyof EditCreateAccount, value: any) => {
    setAccountData(prev => {
      const newData = { ...prev, [field]: value };
      if (!isEditing) {
        if (field === 'current_balance') newData.initial_balance = value;
        if (field === 'initial_balance') newData.current_balance = value;
      }
      return newData;
    });
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    if (!accountData.name.trim()) {
      toast.error('El nombre de la cuenta es obligatorio.');
      return;
    }
    if (!accountData.institution?.id) {
      toast.error('Debes seleccionar una institución bancaria.');
      return;
    }

    setIsSubmitting(true);

    try {
      const inputData = {
        name: accountData.name,
        type: accountData.type,
        currency: accountData.currency,
        color: accountData.color,
        custom_pattern: accountData.custom_pattern,
        custom_text_theme: accountData.custom_text_theme,
        initial_balance: accountData.initial_balance ?? 0, 
        credit_limit: accountData.credit_limit || undefined,
        expiry_date: accountData.expiry_date || "", 
        institution_id: accountData.institution.id, 
        is_active: accountData.is_active ?? true,
      };

      let result = (isEditing && accountData.id) 
        ? await updateAccount(accountData.id, inputData)
        : await createAccount(inputData);

      if (result?.success) {
        toast.success(isEditing ? 'Cuenta actualizada' : 'Cuenta creada');
        if (onSuccess) onSuccess(); 
        router.refresh(); 
      } else {
        toast.error(result?.error || 'Ocurrió un error al guardar');
        setIsSubmitting(false);
      }
    } catch (error) {
      toast.error('Error de conexión');
      setIsSubmitting(false);
    } 
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Clases compartidas para los inputs para mantener consistencia visual
  const inputBaseClasses = "w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] font-semibold rounded-xl px-4 py-3.5 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-medium";
  const labelClasses = "text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block pl-1";

  return (
    <div className="w-full p-2"> 
      
      {/* 💡 NUEVA ESTRUCTURA: Grid 12 Columnas. 5 para la tarjeta, 7 para el form. Gap generoso. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* === COLUMNA IZQUIERDA: TARJETA === */}
        <div className="lg:col-span-5 w-full max-w-[400px] mx-auto lg:mx-0 flex flex-col lg:sticky lg:top-0">
          <EditableUniversalCard 
            data={accountData} 
            onChange={handleChange} 
            institutions={institutions} 
          />
        </div>

        {/* === COLUMNA DERECHA: FORMULARIO === */}
        <div className="lg:col-span-7 flex flex-col w-full">
          
          <div className="flex flex-col gap-6">
            
            {/* Límite de Crédito (TC) */}
            {accountData.type === 'credit_card' && (
              <div>
                <label className={labelClasses}>Límite de Crédito</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{accountData.currency}</span>
                  <input 
                    type="number" 
                    value={accountData.credit_limit || ''} 
                    onChange={(e) => handleChange('credit_limit', Number(e.target.value))} 
                    placeholder="50000" 
                    className={`${inputBaseClasses} pl-14`} 
                  />
                </div>
              </div>
            )}

            {/* Fila de 2 Columnas para Fecha y Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <label className={labelClasses}>Fecha Expiración</label>
                <input 
                  type="text" 
                  maxLength={5}
                  value={accountData.expiry_date || ''} 
                  onChange={(e) => handleChange('expiry_date', e.target.value)} 
                  placeholder="MM/YY" 
                  className={inputBaseClasses} 
                />
              </div>

              <div>
                <label className={labelClasses}>Balance Inicial</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{accountData.currency}</span>
                  <input 
                    type="number" 
                    value={accountData.initial_balance || ''} 
                    onChange={(e) => handleChange('initial_balance', Number(e.target.value))} 
                    disabled={isEditing}
                    placeholder="0.00"
                    className={`${inputBaseClasses} pl-14 disabled:opacity-60 disabled:cursor-not-allowed`} 
                  />
                </div>
              </div>

            </div>

            {/* Auditoría de solo lectura */}
            {isEditing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                <div>
                  <label className={labelClasses}>Fecha de Creación</label>
                  <input type="text" disabled value={formatDate(accountData.created_at)} className={`${inputBaseClasses} bg-slate-100 opacity-70 cursor-not-allowed`} />
                </div>
                <div>
                  <label className={labelClasses}>Última Actualización</label>
                  <input type="text" disabled value={formatDate(accountData.updated_at)} className={`${inputBaseClasses} bg-slate-100 opacity-70 cursor-not-allowed`} />
                </div>
              </div>
            )}

            {isEditing && <div className="h-px w-full bg-slate-100 my-2"></div>}

            {/* Switch de Cuenta Activa */}
            {isEditing && (
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex gap-4 items-center">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-700">
                    <Power size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-slate-800">Cuenta Activa</span>
                    <span className="text-[13px] text-slate-500 font-medium">Visible en los reportes generales.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('is_active', !accountData.is_active)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${accountData.is_active ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${accountData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            )}

          </div>

          <div className="mt-8">
            <button 
              onClick={handleSave} 
              disabled={isSubmitting} 
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white text-[16px] font-bold py-4 rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={20} /> Procesando...</>
              ) : (
                isEditing ? 'Guardar Configuración' : 'Confirmar y Crear Cuenta'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}