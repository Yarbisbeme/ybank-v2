'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // 💡 Importamos los hooks de navegación
import { Account } from '@/types';
import { AnimatedNumber } from '../dashboard/NetWorth/AnimatedNumber';
import { Share2, Edit, Plus, Loader2 } from 'lucide-react'; // 💡 Importamos Loader2 para el spinner

export default function AccountDetailsHeader({ account }: { account: Account }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    setLoadingAction(null);
  }, [searchParams]);

  const handleAction = (type: string, url: string) => {
    // Si ya hay una carga activa, no permitimos otra acción
    if (loadingAction) return;

    setLoadingAction(type);
    router.push(url, { scroll: false });

    // "Seguro de vida": si por algo la URL no cambia en 2 segundos, liberamos el botón
    setTimeout(() => {
      setLoadingAction(prev => prev === type ? null : prev);
    }, 2000);
  };
  
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col items-center justify-center py-2 md:py-4 space-y-1 md:space-y-2">
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
          Current Balance
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
          <span className="text-blue-600 text-3xl mr-1">$</span>
          <AnimatedNumber value={Number(account.current_balance)} />
          <span className="text-sm text-slate-400 ml-2 uppercase">{account.currency}</span>
        </h1>
        <p className="text-slate-400 font-medium text-sm">
          •••• •••• •••• {account.last_4_digits}
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <ActionButton 
          icon={<Plus size={20} />} 
          label="Add" 
          isLoading={loadingAction === 'add'}
          disabled={!!loadingAction}
          onClick={() => handleAction('add', `?accountId=${account.id}&newTx=true`)}
        />
        
        <ActionButton 
          icon={<Edit size={20} />} 
          label="Edit" 
          isLoading={loadingAction === 'edit'}
          disabled={!!loadingAction}
          onClick={() => handleAction('edit', `?accountId=${account.id}&editAccountId=${account.id}`)}
        />
        
        <ActionButton 
          icon={<Share2 size={20} />} 
          label="Share" 
          isLoading={loadingAction === 'share'}
          disabled={!!loadingAction}
          onClick={() => {
            setLoadingAction('share');
            // Simulación de lógica de compartir
            setTimeout(() => setLoadingAction(null), 1000);
          }}
        />
      </div>
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
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 shadow-sm
        ${isLoading 
          ? 'bg-blue-50 border-blue-200 text-blue-600' 
          : 'bg-white border-slate-100 text-slate-900 md:group-hover:bg-blue-600 md:group-hover:text-white md:group-hover:border-blue-600'
        }
      `}>
        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors
        ${isLoading ? 'text-blue-600' : 'text-slate-400 md:group-hover:text-slate-900'}
      `}>
        {isLoading ? '...' : label}
      </span>
    </button>
  );
}
