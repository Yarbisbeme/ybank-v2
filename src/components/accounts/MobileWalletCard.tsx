'use client'

import { useState } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import UniversalCard from '../Tarjetas/UniversalCard';

export default function MobileWalletStack({ accounts }: { accounts: any[] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const handleDragEnd = (e: any, info: PanInfo) => {
    const threshold = 40;
    if (info.offset.x < -threshold && activeIdx < accounts.length - 1) {
      setActiveIdx(prev => prev + 1);
    } else if (info.offset.x > threshold && activeIdx > 0) {
      setActiveIdx(prev => prev - 1);
    }
  };

  return (
    // Mantenemos overflow-hidden para no romper el layout general si hay animaciones extrañas
    <div className="relative w-full h-[220px] sm:scale-120 md:scale-100 sm:h-[255px] flex items-center justify-center overflow-hidden py-4">
      <AnimatePresence initial={false}>
        {accounts.map((acc, index) => {
          let state = "hiddenRight"; 
          
          if (index === activeIdx) state = "active";
          else if (index === activeIdx - 1) state = "prev1";
          else if (index === activeIdx - 2) state = "prev2";
          else if (index < activeIdx - 2) state = "hiddenLeft";
          else if (index > activeIdx) state = "next";

          // 💡 AJUSTE: Desplazamientos más suaves (x) para que no se salgan del contenedor
          const variants = {
            active: { x: 0, scale: 1, opacity: 1, zIndex: 50 },
            prev1: { x: -20, scale: 0.95, opacity: 1, zIndex: 40 }, // Antes: -16
            prev2: { x: -40, scale: 0.90, opacity: 1, zIndex: 30 }, // Antes: -32
            hiddenLeft: { x: -80, scale: 0.85, opacity: 0, zIndex: 20 },
            next: { x: '200%', scale: 0.9, opacity: 0, zIndex: 60 },
            hiddenRight: { x: '200%', scale: 0.9, opacity: 0, zIndex: 10 },
          };

          return (
            <motion.div
              key={acc.id}
              variants={variants}
              initial={false}
              animate={state}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              drag={index === activeIdx ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              // 💡 CORRECCIÓN CLAVE: Cambiamos a 'center' para que escale parejo y no empuje el borde izquierdo fuera del div
              style={{ transformOrigin: "center center" }} 
              className="absolute w-[88%] max-w-[400px] aspect-[1.586/1] cursor-grab active:cursor-grabbing"
              onClick={() => index < activeIdx && setActiveIdx(index)}
            >
              <div className="w-full h-full rounded-[28px] shadow-md overflow-hidden">
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
  );
}