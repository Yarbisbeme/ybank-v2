'use client'

import { useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap, Loader2 } from 'lucide-react';
import DesktopAccounts from './DesktopAccounts';
import MobileWalletStack from './MobileWalletCard'; 
import { useAccounts, useProfile, useUpdateProfile } from '@/hooks/useCatalogs'; 

export default function AccountCarousel() {
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const sortedAccounts = useMemo(() => {
    if (accounts.length === 0) return [];
    if (!profile?.primary_account_id) return accounts;

    const favoriteAcc = accounts.find(a => a.id === profile.primary_account_id);
    if (!favoriteAcc) return accounts;

    const otherAccs = accounts.filter(a => a.id !== profile.primary_account_id);
    
    return [favoriteAcc, ...otherAccs];
  }, [accounts, profile?.primary_account_id]);

  const scroll = (direction: 'left' | 'right') => {
    if (desktopScrollRef.current) {
      const container = desktopScrollRef.current;
      const card = container.firstElementChild as HTMLElement;
      
      if (card) {
        const scrollAmount = card.offsetWidth + 20; 
        container.scrollBy({ 
          left: direction === 'left' ? -scrollAmount : scrollAmount, 
          behavior: 'smooth' 
        });
      }
    }
  };

  useEffect(() => {
    const container = desktopScrollRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault(); 
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleToggleFavorite = (accountId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newPrimaryId = profile?.primary_account_id === accountId ? null : accountId;

    updateProfileMutation.mutate({ 
      primary_account_id: newPrimaryId 
    });
  };

  if (isLoadingAccounts || isLoadingProfile) {
    return (
      <div className="w-full h-[200px] bg-card/50 animate-pulse rounded-[10px] border border-border border-dashed flex flex-col items-center justify-center gap-2">
        <Loader2 size={24} className="animate-spin text-primary/30" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Nodos...</span>
      </div>
    );
  }

  if (accounts.length === 0) return null;

  return (
    <section className="relative w-full">
      
      {/* VERSIÓN ESCRITORIO */}
      <div className="hidden md:block">
        
        <div className="flex justify-between items-end mb-6 px-2">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-muted-foreground" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Ecosistema de Nodos
              </h2>
              <span className="ml-2 px-2 py-0.5 rounded-[4px] bg-surface-2 border border-border text-[9px] font-mono font-bold text-foreground">
                {accounts.length}
              </span>
            </div>

            <div className="flex justify-end gap-2 pr-2">
              <button 
                onClick={() => scroll('left')}
                className="p-1.5 rounded-[6px] bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-card active:scale-95 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>

              <button 
                onClick={() => scroll('right')}
                className="p-1.5 rounded-[6px] bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-card active:scale-95 transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
        </div>

        <DesktopAccounts 
          accounts={sortedAccounts} 
          scrollRef={desktopScrollRef}
          primaryAccountId={profile?.primary_account_id}
          onToggleFavorite={handleToggleFavorite}
        />

      </div>

      {/* VERSIÓN MÓVIL */}
      <div className="block md:hidden">
        <div className="flex items-center justify-center gap-2 mb-4">
              <Zap size={16} className="text-muted-foreground" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Ecosistema de Nodos
              </h2>
              <span className="ml-2 px-2 py-0.5 rounded-[4px] bg-surface-2 border border-border text-[9px] font-mono font-bold text-foreground">
                {accounts.length}
              </span>
        </div>
        <MobileWalletStack 
          accounts={sortedAccounts} 
          primaryAccountId={profile?.primary_account_id}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    </section>
  );
}