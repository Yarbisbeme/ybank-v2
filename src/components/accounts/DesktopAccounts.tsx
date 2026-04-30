'use client'

import { RefObject } from 'react';
import { Account } from '@/types';
import UniversalCard from '../Tarjetas/UniversalCard';

interface DesktopAccountsProps {
  accounts: Account[];
  scrollRef: RefObject<HTMLDivElement | null>;
  activeId?: string;
}

export default function DesktopAccounts({ accounts, scrollRef, activeId }: DesktopAccountsProps) {
  
  return (
    <div 
      ref={scrollRef}
      // 💡 FIX 1: Removimos el padding lateral (px-2) del contenedor. 
      // Así aseguramos que el 100% del ancho sea matemáticamente exacto para las 3 tarjetas.
      className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 pt-2 hide-scrollbar w-full"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {accounts.map((account) => {
        const isSelected = activeId === account.id;

        return (
          <div
            key={account.id}
            className={`snap-start shrink-0 w-[calc((100%-40px)/3)] aspect-[1.58/1] cursor-pointer transition-all duration-300 ease-out origin-bottom
              ${isSelected ? 'scale-[1.02] -translate-y-2' : 'hover:-translate-y-2 hover:shadow-xl'}
            `}
          >
            <UniversalCard 
              account={account} 
              institution={account.institution} 
            />
            
            {isSelected && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full blur-[1px]" />
            )}
          </div>
        );
      })}
    </div>
  );
}