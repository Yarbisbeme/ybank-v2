'use client'

import { useState, useEffect } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import UniversalCard from '../Tarjetas/UniversalCard';
import { Account } from '@/types';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}

export default function AccountStackSelector({ 
  accounts, 
  activeId 
}: { 
  accounts: Account[], 
  activeId?: string 
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  
  const initialIdx = accounts.findIndex(acc => acc.id === activeId);
  const [activeIdx, setActiveIdx] = useState(initialIdx !== -1 ? initialIdx : 0);

  useEffect(() => {
    const newIdx = accounts.findIndex(acc => acc.id === activeId);
    if (newIdx !== -1 && newIdx !== activeIdx) {
      setActiveIdx(newIdx);
    }
  }, [activeId, accounts]);

  const handleSelection = (index: number) => {
    setActiveIdx(index);
    const selectedId = accounts[index]?.id;
    if (selectedId) {
      router.push(`/accounts?accountId=${selectedId}`, { scroll: false });
    }
  };

  const handleNext = () => {
    if (activeIdx < accounts.length - 1) handleSelection(activeIdx + 1);
  };

  const handlePrev = () => {
    if (activeIdx > 0) handleSelection(activeIdx - 1);
  };

  const handleDragEnd = (e: any, info: PanInfo) => {
    const threshold = 40; 
    if (info.offset.x < -threshold && activeIdx < accounts.length - 1) {
      handleNext();
    } else if (info.offset.x > threshold && activeIdx > 0) {
      handlePrev();
    }
  };

  return (
    <div className="relative w-full min-h-[300px] md:min-h-[420px] flex items-center justify-center py-12 group perspective-[1200px]">
      {/* BOTÓN PREVIO */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        disabled={activeIdx === 0}
        className={`hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-[60] p-3 rounded-full bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-200 transition-all duration-300 ${
          activeIdx === 0 
            ? 'opacity-0 translate-x-4 pointer-events-none'
            : 'opacity-100 hover:bg-white hover:scale-110 active:scale-95'
        }`}
      >
        <ChevronLeft className="w-6 h-6 text-slate-800" />
      </button>

      <AnimatePresence initial={false}>
        {accounts.map((acc, index) => {
          let state = "hiddenRight"; 
          
          if (index === activeIdx) state = "active";
          else if (index === activeIdx - 1) state = "prev1";
          else if (index === activeIdx - 2) state = "prev2";
          else if (index < activeIdx - 2) state = "hiddenLeft";
          else if (index === activeIdx + 1) state = "next1"; 
          else if (index > activeIdx + 1) state = "hiddenRight";

          const offsetBase = isMobile ? 70 : 90;

          // 💡 AQUÍ ESTÁ LA MAGIA: Mayor contraste de escalas
          // 💡 Variantes con Hack de Hardware Acceleration para Framer Motion
          const variants = {
            active: { 
              x: 0, 
              y: 0,
              z: 1,           // 👈 Obliga a Framer a usar translate3d siempre
              scale: 1, 
              opacity: 1, 
              zIndex: 50,
              rotateY: 0,
              rotateZ: 0.001, // 👈 Hack mágico anti-pixelado para Chrome
              filter: "brightness(1)"
            },
            prev1: { 
              x: -offsetBase, 
              y: -5,
              z: -10, 
              scale: 0.82, 
              opacity: 0.95, 
              zIndex: 40,
              rotateY: 8, 
              filter: "brightness(0.75)" 
            },
            prev2: { 
              x: -(offsetBase * 1.8), 
              y: -10,
              z: -20,
              scale: 0.72, 
              opacity: 0.8, 
              zIndex: 30,
              rotateY: 15,
              filter: "brightness(0.55)" 
            },
            hiddenLeft: { x: -300, scale: 0.6, opacity: 0, zIndex: 20 },
            next1: { 
              x: offsetBase, 
              y: -5,
              z: -10,
              scale: 0.82, 
              opacity: 0.95, 
              zIndex: 40, 
              rotateY: -8, 
              filter: "brightness(0.75)" 
            },
            hiddenRight: { x: '150%', scale: 0.8, opacity: 0, zIndex: 10 },
          };

          return (
            <motion.div
              key={acc.id}
              variants={variants}
              initial={false}
              animate={state}
              transition={{ type: "spring", stiffness: 250, damping: 28 }}
              drag={index === activeIdx ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              onClick={() => index !== activeIdx && handleSelection(index)}
              // 💡 Trucos anti-pixelado mantenidos
              style={{ 
                transformOrigin: "center center", 
                WebkitFontSmoothing: "antialiased",
                transform: "translateZ(0)"
              }} 
              className={`absolute w-[82vw] md:w-[85%] max-w-[480px] max-h-[300px] aspect-[1.586/1] cursor-grab active:cursor-grabbing transition-shadow duration-500 rounded-[10px] ${
                index === activeIdx 
                  ? 'shadow-[0_20px_40px_rgba(0,0,0,0.15)] ring-1 ring-black/5' 
                  : 'shadow-lg shadow-black/10'
              }`}
            >
              <UniversalCard account={acc} institution={acc.institution} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* BOTÓN NEXT */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        disabled={activeIdx === accounts.length - 1}
        className={`hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-[60] p-3 rounded-full bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-200 transition-all duration-300 ${
          activeIdx === accounts.length - 1 
            ? 'opacity-0 -translate-x-4 pointer-events-none'
            : 'opacity-100 hover:bg-white hover:scale-110 active:scale-95'
        }`}
      >
        <ChevronRight className="w-6 h-6 text-slate-800" />
      </button>

      {/* PUNTOS DE NAVEGACIÓN */}
      <div className="absolute bottom-2 md:bottom-4 flex gap-2 md:gap-3 items-center z-[70]">
        {accounts.map((_, i) => (
          <motion.div 
            key={i}
            animate={{
              width: i === activeIdx ? (isMobile ? 24 : 32) : (isMobile ? 6 : 10),
              height: isMobile ? 6 : 10,
              backgroundColor: i === activeIdx ? '#2563eb' : '#cbd5e1'
            }}
            className="rounded-full shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}