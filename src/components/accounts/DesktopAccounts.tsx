'use client'

import { RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { Account } from '@/types';
import UniversalCard from '../Tarjetas/UniversalCard';

// 1. Asegúrate de que la interfaz reciba las nuevas props
interface DesktopAccountsProps {
  accounts: Account[];
  scrollRef: RefObject<HTMLDivElement | null>;
  activeId?: string;
  primaryAccountId?: string | null; // <--- Faltaba esto
  onToggleFavorite?: (accountId: string, e: React.MouseEvent) => void; // <--- Faltaba esto
}

export default function DesktopAccounts({ 
  accounts, 
  scrollRef, 
  activeId,
  primaryAccountId, // <--- Recíbelo aquí
  onToggleFavorite  // <--- Recíbelo aquí
}: DesktopAccountsProps) {
  const router = useRouter();

  return (
    <div 
      ref={scrollRef}
      className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 pt-2 hide-scrollbar w-full"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {accounts.map((account) => {
        const isSelected = activeId === account.id;

        return (
          <div
            key={account.id}
            onClick={() => router.push(`/accounts?accountId=${account.id}`)}
            className={`snap-start shrink-0 aspect-[1.58/1] cursor-pointer transition-all duration-300 ease-out origin-bottom w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)] ${isSelected ? 'scale-[1.02] -translate-y-2' : 'hover:-translate-y-2 hover:shadow-xl'}`}
          >
            {/* 2. Pásale las props a la tarjeta */}
            <UniversalCard 
              account={account} 
              institution={account.institution} 
              isFavorite={primaryAccountId === account.id} // <--- FALTABA ESTA LÍNEA
              onToggleFavorite={onToggleFavorite}          // <--- Y ESTA LÍNEA
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