'use client'

import { cn } from '@/lib/utils';
import { EditCreateAccount } from '@/types';

interface DetailsProps {
  data: EditCreateAccount;
  onChange: (field: keyof EditCreateAccount, value: any) => void;
  isEditing: boolean;
}

export default function AccountDetailsPanel({ data, onChange, isEditing }: DetailsProps) {
  const inputClasses = "w-full bg-surface-2 border border-border rounded-[10px] px-4 py-3 text-sm font-bold text-foreground outline-none focus:border-primary transition-all";
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
    // 💡 Flex-col h-full asegura que siempre ocupe el alto disponible
    <div className="flex flex-col h-full w-full">
      
      {/* 1. SECCIÓN DE DETALLES ESPECÍFICOS */}
      {data.type === 'credit_card' && (
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
            value={data.cutoff_day || ''}
            onChange={(e) => handleCutoffChange(e.target.value)}
            className={inputClasses}
            placeholder="Día (1-31)"
            />
          </div>
        </div>
      )}

      {/* 2. SECCIÓN DE AUDITORÍA: Dinámica (1 columna si es crédito, 2 si no) */}
      {isEditing && (
        <div className={cn("mt-auto", isCreditCard ? "" : "border-t border-border/80")}>
           <div className={cn(
             "grid gap-4",
             isCreditCard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 mt-2"
           )}>
            <div className="space-y-1">
              <label className={labelClasses}>Creada</label>
              <input 
                disabled 
                value={new Date(data.created_at!).toLocaleDateString()} 
                className={cn(inputClasses, "bg-background text-muted-foreground cursor-not-allowed font-mono")} 
              />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Actualizada</label>
              <input 
                disabled 
                value={new Date(data.updated_at!).toLocaleDateString()} 
                className={cn(inputClasses, "bg-background text-muted-foreground cursor-not-allowed font-mono")} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}