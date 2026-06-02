'use client'

import { cn } from '@/lib/utils';
import { EditCreateAccount } from '@/types';

interface DetailsProps {
  data: EditCreateAccount;
  // 💡 CORRECCIÓN TÉCNICA: Actualizamos la firma para que coincida con el padre
  onChange: (field: string | Record<string, any>, value?: any) => void;
  isEditing: boolean;
}

export default function AccountDetailsPanel({ data, onChange, isEditing }: DetailsProps) {
  // 💡 CORRECCIÓN VISUAL: Usamos bg-black/20 (en oscuro) para un input hundido elegante
  // en lugar del Negro Absoluto que domina demasiado.
  const inputClasses = "w-full bg-black/5 dark:bg-black/20 border border-border rounded-[10px] px-4 py-3 text-sm font-bold text-foreground outline-none focus:border-primary transition-all";
  const labelClasses = "text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 block";

  const handleCutoffChange = (value: string) => {
    const v = value.replace(/\D/g, '');
    const num = parseInt(v);
    
    if (v === '') {
        onChange('cutoff_day', '');
        return;
    }
    
    let clamped = Math.min(Math.max(num, 1), 31);
    onChange('cutoff_day', clamped);
  };

  const isCreditCard = data.type === 'credit_card';

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* 1. SECCIÓN DE DETALLES ESPECÍFICOS */}
      {isCreditCard && (
        <div className="space-y-4 pb-4">
          <div className="space-y-1">
            <label className={labelClasses}>Límite Aprobado</label>
            <input 
              type="number"
              value={data.credit_limit || ''}
              onChange={(e) => onChange('credit_limit', Number(e.target.value))}
              className={inputClasses}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <label className={labelClasses}>Día de Corte</label>
            <input 
              type="text"
              inputMode="numeric"
              value={data.cutoff_day || ''}
              onChange={(e) => handleCutoffChange(e.target.value)}
              className={inputClasses}
              placeholder="Día (1-31)"
            />
          </div>
        </div>
      )}

      {/* 2. SECCIÓN DE AUDITORÍA */}
      {isEditing && data.created_at && data.updated_at && (
        <div className={cn("mt-auto", isCreditCard ? "" : "border-t border-border/80")}>
           <div className={cn(
             "grid gap-4",
             isCreditCard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 mt-4"
           )}>
            <div className="space-y-1">
              <label className={labelClasses}>Creada</label>
              <input 
                disabled 
                value={new Date(data.created_at).toLocaleDateString()} 
                className={cn(inputClasses, "bg-transparent dark:bg-transparent border-transparent text-muted-foreground cursor-not-allowed font-mono px-0 py-1")} 
              />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Actualizada</label>
              <input 
                disabled 
                value={new Date(data.updated_at).toLocaleDateString()} 
                className={cn(inputClasses, "bg-transparent dark:bg-transparent border-transparent text-muted-foreground cursor-not-allowed font-mono px-0 py-1")} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}