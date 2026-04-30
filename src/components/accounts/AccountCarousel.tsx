'use client'

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import DesktopAccounts from './DesktopAccounts';
import { Account } from '@/types';
import MobileWalletStack from './MobileWalletCard'; 

interface AccountCarouselProps {
  accounts: Account[];
  activeId?: string; 
}

export default function AccountCarousel({ accounts, activeId }: AccountCarouselProps) {
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (desktopScrollRef.current) {
      const container = desktopScrollRef.current;
      const card = container.firstElementChild as HTMLElement;
      
      if (card) {
        // 💡 Ajustamos de +24 a +20 porque estamos usando "gap-5" (20px) en Tailwind
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

  return (
    <section className="relative w-full pb-8">
      
      {/* VERSIÓN ESCRITORIO */}
      <div className="hidden md:block">
        
        {/* HEADER YBANK: Semántico y Minimalista */}
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

            {/* CONTROLES: Flat, sin shadows, variables dinámicas */}
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

        {/* CONTENEDOR DE TARJETAS */}
        <DesktopAccounts 
          accounts={accounts} 
          scrollRef={desktopScrollRef}
          activeId={activeId}
        />

      </div>

      {/* VERSIÓN MÓVIL */}
      <div className="block md:hidden">
        <MobileWalletStack accounts={accounts} />
      </div>
    </section>
  );
}