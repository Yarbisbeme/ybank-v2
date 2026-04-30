'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Account } from '@/types';
import { Share2, Edit, Plus, Loader2 } from 'lucide-react';

export default function AccountDetailsHeader({ account }: { account: Account }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    setLoadingAction(null);
  }, [searchParams]);

  const handleAction = (type: string, url: string) => {
    if (loadingAction) return;

    setLoadingAction(type);
    router.push(url, { scroll: false });

    setTimeout(() => {
      setLoadingAction(prev => prev === type ? null : prev);
    }, 2000);
  };
  
  return (
    // 💡 Redujimos el contenedor a solo agrupar los botones
    <div className="flex justify-center gap-4 pt-2">
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
          setTimeout(() => setLoadingAction(null), 1000);
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
      {/* 💡 Identidad YBANK: rounded-[10px], shadow-sm y bordes sutiles */}
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