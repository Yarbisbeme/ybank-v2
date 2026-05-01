'use client'

import { Account } from '@/types';
import { Share2, Edit, Plus, Loader2 } from 'lucide-react';
import { useModalStore } from '@/store/useModalStore'; // 💡 Importamos tu nuevo store

export default function AccountDetailsHeader({ account }: { account: Account }) {
  // 💡 Extraemos la función openModal de Zustand
  const openModal = useModalStore((state) => state.openModal);
  
  return (
    <div className="flex justify-center gap-4 pt-2">
      <ActionButton 
        icon={<Plus size={20} />} 
        label="Add" 
        // 💡 Abrimos el modal instantáneamente pasándole el payload
        onClick={() => openModal('transaction', { accountId: account.id })}
      />
      
      <ActionButton 
        icon={<Edit size={20} />} 
        label="Edit" 
        // 💡 Abrimos el modal de cuenta instantáneamente
        onClick={() => openModal('account', { accountId: account.id })}
      />
      
      <ActionButton 
        icon={<Share2 size={20} />} 
        label="Share" 
        onClick={() => {
          // Lógica futura para compartir (ej. navigator.share o copiar al portapapeles)
          console.log("Compartir cuenta:", account.name);
        }}
      />
    </div>
  );
}

// 💡 El ActionButton se queda igual para conservar tu excelente diseño visual, 
// aunque ya no necesite el estado de 'isLoading' por ahora.
function ActionButton({ 
  icon, 
  label, 
  isLoading, 
  disabled, 
  onClick 
}: { 
  icon: React.ReactNode, 
  label: string, 
  isLoading?: boolean,
  disabled?: boolean,
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled || isLoading}
      className="flex flex-col items-center gap-2 group cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 transition-all"
    >
      <div className={`w-14 h-14 rounded-[10px] border flex items-center justify-center transition-all duration-300 shadow-sm
        ${isLoading 
          ? 'bg-blue-50/50 border-blue-200 text-blue-600' 
          : 'bg-card border-border text-foreground hover:border-primary hover:text-primary'
        }
      `}>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors
        ${isLoading ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
      `}>
        {isLoading ? '...' : label}
      </span>
    </button>
  );
}