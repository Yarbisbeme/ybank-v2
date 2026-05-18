'use client'

import { useState } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation'; 
import UniversalCard from '../Tarjetas/UniversalCard';

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

  return (
    <div className="relative w-full h-[240px] sm:h-[290px] flex items-center justify-center">
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
            prev1: { x: -10, scale: 0.95, opacity: 1, zIndex: 40 },
            prev2: { x: -25, scale: 0.90, opacity: 1, zIndex: 30 },
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
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              style={{ transformOrigin: "center center" }} 
              className="absolute w-[90%] max-w-[400px] aspect-[1.586/1] cursor-grab active:cursor-grabbing"
              onClick={() => handleClick(index, acc.id)}
            >
              <div className="w-full h-full shadow-md overflow-hidden">
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