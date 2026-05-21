'use client'

import { useState } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation'; 
import UniversalCard from '../Tarjetas/UniversalCard';
import { cn } from '@/lib/utils'; // Asegúrate de tener tu helper cn o usa strings normales

export default function MobileWalletStack({ accounts }: { accounts: any[] }) {

  const [activeIdx, setActiveIdx] = useState(0);
  const router = useRouter(); 
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (e: any, info: PanInfo) => {
    setTimeout(() => setIsDragging(false), 100); 

    const threshold = 40;
    if (info.offset.x < -threshold && activeIdx < accounts.length - 1) {
      setActiveIdx(prev => prev + 1);
    } else if (info.offset.x > threshold && activeIdx > 0) {
      setActiveIdx(prev => prev - 1);
    }
  };

  const handleClick = (index: number, accountId: string) => {
    if (isDragging) return; 
    if (index < activeIdx) {
      setActiveIdx(index);
    } else if (index === activeIdx) {
      router.push(`/accounts?accountId=${accountId}`);
    }
  };

  if (!accounts || accounts.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full h-[240px] sm:h-[290px] flex items-center justify-center overflow-visible">
        <AnimatePresence initial={false}>
          {accounts.map((acc, index) => {
            let state = "hiddenRight"; 
            
            if (index === activeIdx) state = "active";
            else if (index === activeIdx - 1) state = "prev1";
            else if (index === activeIdx - 2) state = "prev2";
            else if (index < activeIdx - 2) state = "hiddenLeft";
            else if (index > activeIdx) state = "next";

            const variants = {
              active: { x: 5, scale: 1, opacity: 1, zIndex: 50 },
              prev1: { x: -12, scale: 0.94, opacity: 1, zIndex: 40 },
              prev2: { x: -28, scale: 0.88, opacity: 1, zIndex: 30 },
              hiddenLeft: { x: -100, scale: 0.80, opacity: 0, zIndex: 20 },
              next: { x: '150%', scale: 0.9, opacity: 0, zIndex: 60 },
              hiddenRight: { x: '150%', scale: 0.9, opacity: 0, zIndex: 10 },
            };

            return (
              <motion.div
                key={acc.id}
                variants={variants}
                initial={false}
                animate={state}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                drag={index === activeIdx ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ transformOrigin: "center center" }} 
                className="absolute w-[88%] max-w-[380px] aspect-[1.586/1] cursor-grab active:cursor-grabbing"
                onClick={() => handleClick(index, acc.id)}
              >
                <div className="w-full h-full shadow-[0_15px_30px_-10px_rgba(0,0,0,0.2)] rounded-[12px] overflow-hidden">
                  <UniversalCard 
                    account={acc} 
                    institution={acc.institution} 
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 🔘 INDICADORES DE CONTEXTO (Estilo Paginación Inteligente) */}
      {accounts.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2 pb-4">
          {accounts.map((acc, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={`bullet-${acc.id}`}
                onClick={() => setActiveIdx(idx)}
                className="p-1 group outline-none"
                title={`Ir a nodo ${acc.name || idx + 1}`}
              >
                <motion.div
                  animate={{
                    width: isActive ? 16 : 6,
                    backgroundColor: isActive ? 'var(--primary, #0070f3)' : 'rgba(156, 163, 175, 0.3)'
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="h-1.5 rounded-full transition-colors group-hover:bg-muted-foreground/50"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}