'use client'

import { RefObject } from 'react';
import UniversalCard from '../Tarjetas/UniversalCard';
import { Account } from '@/types';

interface DesktopAccountsProps {
  accounts: Account[]; 
  scrollRef: RefObject<HTMLDivElement | null>;
}

export default function DesktopAccounts({ accounts, scrollRef }: DesktopAccountsProps) {
  return (
    <div 
      ref={scrollRef}
      // Añadimos pl-1 y pr-6 para asegurar que al final del scroll no se pegue al borde derecho
      className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4 -my-4 pl-1 pr-6"
    >
      {accounts.map((acc) => (
        <div 
          key={acc.id} 
          // 💡 MAGIA MATEMÁTICA AQUÍ:
          // Pantallas medianas (laptops): Exactamente 2 tarjetas (50% menos la mitad de 1 gap)
          // Pantallas grandes (xl): Exactamente 3 tarjetas (33.3% menos la proporción de los gaps)
          // shrink-0 evita que el navegador intente aplastarlas
          className="min-w-[calc(50%-12px)] xl:min-w-[calc(33.333%-16px)] shrink-0 aspect-[1.45/1] snap-start group"
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