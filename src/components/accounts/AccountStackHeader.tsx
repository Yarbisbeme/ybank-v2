'use client'

import { useState, useEffect } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Account } from '@/types';
import UniversalCard from '../Tarjetas/UniversalCard';

export default function AccountStackHeader({ 
  accounts, 
  activeId 
}: { 
  accounts: Account[], 
  activeId?: string 
}) {
  const router = useRouter();
  
  // Sincronizar el índice inicial con la cuenta de la URL
  const initialIdx = accounts.findIndex(acc => acc.id === activeId);
  const [activeIdx, setActiveIdx] = useState(initialIdx !== -1 ? initialIdx : 0);

  // 💡 Solo navegamos si el índice cambia por interacción del usuario
  const handleSelection = (index: number) => {
    setActiveIdx(index);
    const selectedId = accounts[index]?.id;
    if (selectedId) {
      router.push(`/accounts?accountId=${selectedId}`, { scroll: false });
    }
  };

  const handleDragEnd = (e: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && activeIdx < accounts.length - 1) {
      handleSelection(activeIdx + 1);
    } else if (info.offset.x > threshold && activeIdx > 0) {
      handleSelection(activeIdx - 1);
    }
  };

  return (
    <div className="relative w-full h-[280px] flex items-center justify-center overflow-hidden pt-4 pb-12">
      <AnimatePresence initial={false}>
        {accounts.map((acc, index) => {
          let state = "hiddenRight"; 
          
          if (index === activeIdx) state = "active";
          else if (index === activeIdx - 1) state = "prev1";
          else if (index === activeIdx - 2) state = "prev2";
          else if (index < activeIdx - 2) state = "hiddenLeft";
          else if (index > activeIdx) state = "next";

          const variants = {
            active: { x: 0, y: 0, scale: 1.1, opacity: 1, zIndex: 50 },
            prev1: { x: -35, y: -15, scale: 0.95, opacity: 0.8, zIndex: 40 },
            prev2: { x: -70, y: -30, scale: 0.85, opacity: 0.4, zIndex: 30 },
            hiddenLeft: { x: -150, scale: 0.7, opacity: 0, zIndex: 20 },
            next: { x: '150%', scale: 0.9, opacity: 0, zIndex: 60 },
            hiddenRight: { x: '150%', scale: 0.9, opacity: 0, zIndex: 10 },
          };

          return (
            <motion.div
              key={acc.id}
              variants={variants}
              initial={false}
              animate={state}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag={index === activeIdx ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              onClick={() => index !== activeIdx && handleSelection(index)}
              style={{ transformOrigin: "center center" }} 
              className="absolute w-[85%] max-w-[420px] aspect-[1.586/1] cursor-grab active:cursor-grabbing"
            >
              <div className={`w-full h-full rounded-[32px] overflow-hidden transition-shadow duration-500 ${
                index === activeIdx ? 'shadow-2xl shadow-blue-900/10' : 'shadow-md'
              }`}>
                <UniversalCard account={acc} institution={acc.institution}/>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Indicador de posición */}
      <div className="absolute bottom-4 flex gap-1.5">
        {accounts.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
            i === activeIdx ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200'
          }`} />
        ))}
      </div>
    </div>
  );
}