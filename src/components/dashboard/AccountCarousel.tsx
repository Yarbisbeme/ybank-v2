'use client'

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DesktopAccounts from './DesktopAccounts';
import MobileWalletStack from './MobileWalletStack';
import { Account } from '@/types';

// 💡 Los props se definen en un solo objeto
interface AccountCarouselProps {
  accounts: Account[];
}

export default function AccountCarousel({ accounts }: AccountCarouselProps) {
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
      <div className="flex justify-between items-end mb-8 px-1 ">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tighter italic">Your Accounts</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Nodes: {accounts?.length || 0}
          </p>
        </div>
        
        <div className="hidden md:flex gap-2">
          <button 
            onClick={() => scroll('left')} 
            className="p-2.5 rounded-full border border-slate-200 bg-white hover:border-blue-600 hover:text-blue-600 transition-all active:scale-90 shadow-sm text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => scroll('right')} 
            className="p-2.5 rounded-full border border-slate-200 bg-white hover:border-blue-600 hover:text-blue-600 transition-all active:scale-90 shadow-sm text-slate-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <DesktopAccounts accounts={accounts} scrollRef={desktopScrollRef} />
      </div>
      
      <div className="block md:hidden ">
        {/* 💡 También actualiza MobileWalletStack para que use UniversalCard internamente */}
        <MobileWalletStack accounts={accounts} />
      </div>
    </section>
  );
}