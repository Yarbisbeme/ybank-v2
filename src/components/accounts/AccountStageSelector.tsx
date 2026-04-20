'use client'

import { useState, useEffect } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import UniversalCard from '../Tarjetas/UniversalCard';
import { Account } from '@/types';

export default function AccountStackSelector({ 
  accounts, 
  activeId 
}: { 
  accounts: Account[], 
  activeId?: string 
}) {
  const router = useRouter();
  
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
    <div className="relative w-full h-[440px] flex items-center justify-center overflow-hidden py-10 group">
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        disabled={activeIdx === 0}
        className={`absolute left-2 md:left-8 z-[60] p-3 rounded-full bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 transition-all duration-300 ${
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
          else if (index === activeIdx + 1) state = "next1"; // 💡 Nuevo estado para la siguiente
          else if (index > activeIdx + 1) state = "hiddenRight";

          // 💡 GEOMETRÍA SÓLIDA: Sin transparencia, más juntas y asomando por la derecha
          const variants = {
            active: { 
              x: 0, 
              y: 0,
              scale: 1.1, 
              opacity: 1, // 100% sólido
              zIndex: 50,
              rotateY: 0,
              filter: "blur(0px) brightness(1)" // Brillo normal
            },
            prev1: { 
              x: -90, // 👈 Más pegada a la activa (antes era -140)
              y: -5,
              scale: 0.95, 
              opacity: 1, // 👈 100% sólido
              zIndex: 40,
              rotateY: 8, 
              filter: "blur(0.5px) brightness(0.85)" // Oscurecemos un poco para dar profundidad en vez de transparencia
            },
            prev2: { 
              x: -170, // 👈 Más pegada a la prev1
              y: -10,
              scale: 0.85, 
              opacity: 1, // 👈 100% sólido
              zIndex: 30,
              rotateY: 15,
              filter: "blur(1px) brightness(0.7)" // Más oscura al fondo
            },
            hiddenLeft: { x: -300, scale: 0.7, opacity: 0, zIndex: 20 },
            
            // 💡 ESTADO NEXT1: Se asoma por la derecha, detrás de la activa
            next1: { 
              x: 100, // 👈 Se asoma por la derecha
              y: -5,
              scale: 0.95, 
              opacity: 1, // 100% sólido
              zIndex: 40, // Va detrás de la activa
              rotateY: -8, // Rota en sentido contrario
              filter: "blur(0.5px) brightness(0.85)" 
            },
            hiddenRight: { x: '150%', scale: 0.9, opacity: 0, zIndex: 10 },
          };

          return (
            <motion.div
              key={acc.id}
              variants={variants}
              initial={false}
              animate={state}
              transition={{ 
                type: "spring", 
                stiffness: 250, 
                damping: 28 
              }}
              drag={index === activeIdx ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              onClick={() => index !== activeIdx && handleSelection(index)}
              style={{ 
                transformOrigin: "center center",
                perspective: "1000px" 
              }} 
              className="absolute w-[85%] max-w-[420px] aspect-[1.586/1] cursor-grab active:cursor-grabbing preserve-3d"
            >
              <div className={`
                w-full h-full rounded-[40px] overflow-hidden transition-all duration-500
                ${index === activeIdx 
                  ? 'shadow-[0_20px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/20' 
                  : 'shadow-lg shadow-black/40'} /* 💡 Sombra más dura para las de atrás para separar los sólidos */
              `}>
                <UniversalCard 
                  account={acc} 
                  institution={acc.institution} 
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        disabled={activeIdx === accounts.length - 1}
        className={`absolute right-2 md:right-8 z-[60] p-3 rounded-full bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 transition-all duration-300 ${
          activeIdx === accounts.length - 1 
            ? 'opacity-0 -translate-x-4 pointer-events-none'
            : 'opacity-100 hover:bg-white hover:scale-110 active:scale-95'
        }`}
      >
        <ChevronRight className="w-6 h-6 text-slate-800" />
      </button>

      <div className="absolute bottom-2 flex gap-3 items-center">
        {accounts.map((_, i) => (
          <motion.div 
            key={i}
            animate={{
              width: i === activeIdx ? 32 : 10,
              height: 10,
              backgroundColor: i === activeIdx ? '#2563eb' : '#cbd5e1'
            }}
            className="rounded-full shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}