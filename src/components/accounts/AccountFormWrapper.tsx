'use client'

import { useState } from 'react';
import EditableUniversalCard from './EditableUniversalCard';
import { EditCreateAccount, Institution } from '@/types'; 
import { ShieldCheck, Calendar, Activity, CreditCard, Power, Loader2 } from 'lucide-react';
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

  const [accountData, setAccountData] = useState<EditCreateAccount>(
    initialData || {
      name: '',
      type: 'checking',
      currency: 'DOP',
      color: '#0f172a', // Color por defecto (Oscuro)
      custom_pattern: 'geometric',
      custom_text_theme: 'light',
      current_balance: 0,
      last_4_digits: '',
      institution: emptyInstitution,
      is_active: true,
      initial_balance: 0
    }
  );

  const router = useRouter(); // 💡 Para refrescar la página tras guardar
  const [isSubmitting, setIsSubmitting] = useState(false); // 💡 Estado de carga

  const handleChange = (field: keyof EditCreateAccount, value: any) => {
    setAccountData(prev => ({ ...prev, [field]: value }));
  };

  // 💡 LÓGICA DE GUARDADO REAL
  const handleSave = async () => {
    if (isSubmitting) return;

    // 1. Validaciones básicas
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
      // 2. Preparamos los datos EXACTAMENTE como los pide la interfaz
      const inputData = {
        name: accountData.name,
        type: accountData.type,
        currency: accountData.currency,
        color: accountData.color,
        custom_pattern: accountData.custom_pattern,
        custom_text_theme: accountData.custom_text_theme,
        initial_balance: accountData.initial_balance ?? 0, 
        
        credit_limit: accountData.credit_limit || undefined,
        
        // 💡 FIX: Cambiamos "undefined" por un string vacío ""
        expiry_date: accountData.expiry_date || "", 
        
        institution_id: accountData.institution.id, 
        is_active: accountData.is_active ?? true,
      };

      // 3. Llamamos a la API
      let result;
      if (isEditing && accountData.id) {
        // 💡 FIX Error 1: Pasamos los 2 argumentos separados (ID, Datos)
        result = await updateAccount(accountData.id, inputData);
      } else {
        // Para crear, solo enviamos los datos
        result = await createAccount(inputData);
      }

      // 4. Manejamos el resultado
      if (result?.success) {
        toast.success(isEditing ? 'Cuenta actualizada con éxito' : 'Cuenta creada con éxito');
        if (onSuccess) onSuccess(); 
        router.refresh(); 
      } else {
        toast.error(result?.error || 'Ocurrió un error al guardar la cuenta');
      setIsSubmitting(false);
      }
    } catch (error) {
      toast.error('Error de conexión con el servidor');
      console.error(error);
      setIsSubmitting(false);
    } 
  };

  // Función para formatear fechas de forma legible
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 md:p-8 bg-white rounded-[32px] shadow-2xl w-full">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        <div className="lg:col-span-5 flex flex-col items-center">
          <EditableUniversalCard 
            data={accountData} 
            onChange={handleChange} 
            institutions={institutions} 
          />
        </div>

        {/* COLUMNA DERECHA: Detalles de la Base de Datos (Ocupa 7 de 12 columnas) */}
        <div className="lg:col-span-7 flex flex-col">
          
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-blue-500" /> Detalles Técnicos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            
            {/* Límite de Crédito (Solo editable si es Tarjeta de Crédito) */}
            {accountData.type === 'credit_card' && (
              <div className="space-y-1 md:col-span-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CreditCard size={14} /> Límite de Crédito ({accountData.currency})
                </label>
                <input 
                  type="number" 
                  value={accountData.credit_limit || ''} 
                  onChange={(e) => handleChange('credit_limit', Number(e.target.value))} 
                  placeholder="Ej. 50000" 
                  className="w-full bg-white border border-blue-200 p-3 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
              </div>
            )}

            {/* Fecha de Expiración (Editable) */}
            <div className="space-y-1 p-3 rounded-xl border border-slate-200 bg-slate-50">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Expiración</label>
              <input 
                type="text" 
                maxLength={5}
                value={accountData.expiry_date || ''} 
                onChange={(e) => handleChange('expiry_date', e.target.value)} 
                placeholder="MM/YY" 
                className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 focus:ring-0 placeholder:text-slate-300" 
              />
            </div>

            {/* Balance Inicial (Editable solo al crear) */}
            <div className={`space-y-1 p-3 rounded-xl border ${isEditing ? 'border-slate-100 bg-slate-50/50 opacity-70' : 'border-slate-200 bg-slate-50'}`}>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance Inicial Base</label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400">{accountData.currency}</span>
                <input 
                  type="number" 
                  value={accountData.initial_balance || 0} 
                  onChange={(e) => handleChange('initial_balance', Number(e.target.value))} 
                  disabled={isEditing}
                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 focus:ring-0 disabled:cursor-not-allowed" 
                />
              </div>
            </div>

            {/* Información de Auditoría (Solo Lectura, solo si estamos editando) */}
            {isEditing && (
              <>
                <div className="space-y-1 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} /> Creación
                  </label>
                  <p className="text-xs font-semibold text-slate-600 truncate">{formatDate(accountData.created_at)}</p>
                </div>

                <div className="space-y-1 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Activity size={12} /> Última Act.
                  </label>
                  <p className="text-xs font-semibold text-slate-600 truncate">{formatDate(accountData.updated_at)}</p>
                </div>
              </>
            )}

            {/* Switch de Archivar Cuenta (Solo editable si ya existe) */}
            {isEditing && (
              <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Power size={16} className={accountData.is_active ? 'text-blue-500' : 'text-slate-400'} />
                    Cuenta Activa
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Desactiva esta cuenta para ocultarla de los reportes principales sin borrar su historial.
                  </p>
                </div>
                {/* Toggle Switch Custom Tailwind */}
                <button
                  type="button"
                  onClick={() => handleChange('is_active', !accountData.is_active)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${accountData.is_active ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${accountData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            )}

          </div>

          <button 
            onClick={handleSave} 
            disabled={isSubmitting} 
            className="flex items-center justify-center gap-2 w-full mt-6 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} /> 
                Guardando...
              </>
            ) : (
              isEditing ? 'Guardar Configuración' : 'Crear Cuenta Bancaria'
            )}
          </button>

        </div>
      </div>
    </div>
  );
}