'use client'

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DesktopAccounts from './DesktopAccounts';
import { Account } from '@/types';
import MobileWalletStack from './MobileWalletCard';

// 💡 Agregamos activeId a la interfaz
interface AccountCarouselProps {
  accounts: Account[];
  activeId?: string; // 👈 Nueva prop opcional
}

export default function AccountCarousel({ accounts, activeId }: AccountCarouselProps) {
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (desktopScrollRef.current) {
      const { scrollLeft, clientWidth } = desktopScrollRef.current;
      desktopScrollRef.current.scrollTo({ 
        left: direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <section className="relative w-full pb-12">
      {/* ... (Cabecera igual) */}

      <div className="hidden md:block">
        {/* 💡 Pasamos el activeId a DesktopAccounts */}
        <DesktopAccounts 
          accounts={accounts} 
          scrollRef={desktopScrollRef}
        />
      </div>
      
      <div className="block md:hidden ">
        {/* 💡 Pasamos el activeId a MobileWalletStack */}
        <MobileWalletStack 
          accounts={accounts} 
        />
      </div>
    </section>
  );
}