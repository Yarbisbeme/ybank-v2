'use client';

import { useMemo } from 'react';
import { Share2, Edit, Plus, Loader2 } from 'lucide-react';
import { useModalStore } from '@/store/useModalStore';
import { useFilterStore } from '@/store/useFilterStore'; // 💡 Importamos el filtro
import { useAccounts } from '@/hooks/useCatalogs';     // 💡 Importamos el hook de caché

export default function AccountDetailsHeader() {
  const openModal = useModalStore((state) => state.openModal);
  const { accountId } = useFilterStore(); // Obtenemos el ID de la cuenta activa desde Zustand
  
  // 1. Obtenemos las cuentas de la caché
  const { data: accounts = [], isLoading } = useAccounts();

  // 2. Determinamos qué cuenta mostrar (La seleccionada o la primera por defecto)
  const activeAccount = useMemo(() => {
    if (accounts.length === 0) return null;
    return accounts.find(a => a.id === accountId) || accounts[0];
  }, [accounts, accountId]);

  // 3. Estado de carga discreto para el header
  if (isLoading) {
    return (
      <div className="flex justify-center gap-4 pt-2 opacity-50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
            <div className="w-14 h-14 rounded-[10px] border border-border bg-surface-2" />
            <div className="h-2 w-8 bg-surface-2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!activeAccount) return null;

  return (
    <div className="flex justify-center gap-4 pt-2">
      <ActionButton 
        icon={<Plus size={20} />} 
        label="Add" 
        onClick={() => openModal('transaction', { accountId: activeAccount.id })}
      />
      
      <ActionButton 
        icon={<Edit size={20} />} 
        label="Edit" 
        onClick={() => openModal('account', { accountId: activeAccount.id })}
      />
      
      <ActionButton 
        icon={<Share2 size={20} />} 
        label="Share" 
        onClick={() => {
          // Lógica futura para compartir (ej. navigator.share o copiar al portapapeles)
          console.log("Compartir cuenta:", activeAccount.name);
        }}
      />
    </div>
  );
}

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