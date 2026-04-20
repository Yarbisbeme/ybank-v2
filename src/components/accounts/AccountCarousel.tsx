'use client'

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DesktopAccounts from './DesktopAccounts';
import { Account } from '@/types';
import MobileWalletStack from './MobileWalletCard'; 

interface AccountCarouselProps {
  accounts: Account[];
  activeId?: string; 
}

export default function AccountCarousel({ accounts, activeId }: AccountCarouselProps) {
  // Usaremos UN SOLO ref para controlar todo
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (desktopScrollRef.current) {
      const container = desktopScrollRef.current;
      const card = container.firstElementChild as HTMLElement;
      
      if (card) {
        const scrollAmount = card.offsetWidth + 24; 
        
        container.scrollBy({ 
          left: direction === 'left' ? -scrollAmount : scrollAmount, 
          behavior: 'smooth' 
        });
      }
    }
  };

  // 💡 LA NUEVA MAGIA: Simple, directa y nativa
  useEffect(() => {
    const container = desktopScrollRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // ¿Es un movimiento principalmente VERTICAL (Rueda de mouse clásica)?
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        // 1. BLOQUEA la página para que no baje. ¡Funciona porque es el contenedor exacto!
        e.preventDefault(); 
        // 2. Traduce el movimiento vertical a horizontal
        container.scrollLeft += e.deltaY;
      }
      // 💡 Si es un movimiento HORIZONTAL (Trackpad), no hacemos absolutamente nada. 
      // Dejamos que el navegador use su física y su inercia natural, sin saltos locos.
    };

    // { passive: false } obliga al navegador a respetar nuestro preventDefault()
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <section className="relative w-full pb-12">
      
      {/* VERSIÓN ESCRITORIO */}
      <div className="hidden md:block">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">Tus Cuentas</h2>
            <div className="flex justify-end gap-3 mb-2 pr-6">
              <button 
                onClick={() => scroll('left')}
                className="p-2 rounded-full bg-white shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>

              <button 
                onClick={() => scroll('right')}
                className="p-2 rounded-full bg-white shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
        </div>
            {/* Pasamos el ref directamente al componente DesktopAccounts */}
            <DesktopAccounts 
              accounts={accounts} 
              scrollRef={desktopScrollRef}
            />

        </div>

      {/* VERSIÓN MÓVIL */}
      <div className="block md:hidden">
        <MobileWalletStack accounts={accounts} />
      </div>
    </section>
  );
}