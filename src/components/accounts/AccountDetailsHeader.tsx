'use client';

import { useMemo } from 'react';
import { Share2, Edit, Plus, Loader2 } from 'lucide-react';
import { useModalStore } from '@/store/useModalStore';
import { useSearchParams } from 'next/navigation'; // 💡 Reemplazamos useFilterStore por useSearchParams
import { useAccounts } from '@/hooks/useCatalogs'; 
import { toast } from 'sonner';

export default function AccountDetailsHeader() {
  const openModal = useModalStore((state) => state.openModal);
  
  // 💡 Obtenemos el ID directamente de la URL de forma síncrona
  const searchParams = useSearchParams();
  const urlAccountId = searchParams.get('accountId'); 
  
  const { data: accounts = [], isLoading } = useAccounts();

  // Determinamos qué cuenta mostrar de manera ultra-segura
  const activeAccount = useMemo(() => {
    if (accounts.length === 0) return null;
    // Si hay un ID en la URL, lo usamos; si no, por defecto mostramos la primera cuenta de la caché
    return accounts.find(a => a.id === urlAccountId) || accounts[0];
  }, [accounts, urlAccountId]);

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
          if (navigator.share) {
            navigator.share({
              title: `YBank - ${activeAccount.name}`,
              text: `Revisando el balance de mi nodo financiero.`,
              url: window.location.href,
            }).catch(console.error);
          } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Enlace de telemetría copiado al portapapeles");
          }
        }}
      />
    </div>
  );
}

// ... (ActionButton se queda exactamente igual)

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