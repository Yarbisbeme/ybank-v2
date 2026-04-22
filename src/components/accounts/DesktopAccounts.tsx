'use client'

import { RefObject } from 'react';
import { useRouter } from 'next/navigation'; // 💡 1. Importamos el router
import UniversalCard from '../Tarjetas/UniversalCard';
import { Account } from '@/types';

interface DesktopAccountsProps {
  accounts: Account[]; 
  scrollRef: RefObject<HTMLDivElement | null>;
}

export default function DesktopAccounts({ accounts, scrollRef }: DesktopAccountsProps) {
  const router = useRouter(); // 💡 2. Inicializamos el router

  return (
    <div 
      ref={scrollRef}
      className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4 -my-4"
    >
      {accounts.map((acc) => (
        <div 
          key={acc.id} 
          // 💡 3. Añadimos 'cursor-pointer' a las clases
          className="min-w-[calc(50%-12px)] xl:min-w-[calc(33.333%-16px)] shrink-0 aspect-[1.45/1] snap-start group cursor-pointer"
          
          // 💡 4. Añadimos el evento onClick para navegar
          onClick={() => {
            // Te lleva a la página de cuentas y carga automáticamente esta tarjeta
            router.push(`/accounts?accountId=${acc.id}`);
          }}
        >
          <div className="w-full h-full rounded-[28px] shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-md grid place-items-stretch">
            <UniversalCard 
              account={acc} 
              institution={acc.institution} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}