'use client'

import { motion } from 'framer-motion';
import { Transaction } from '@/types';
import { useMemo, useState, useEffect } from 'react';

export default function WeeklyActivityChart({ transactions }: { transactions: Transaction[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const weeklyData = useMemo(() => {
    if (!mounted) return []; 

    const curr = new Date();
    const today = getLocalDateString(curr);
    const dayOfWeek = curr.getDay() === 0 ? 6 : curr.getDay() - 1;
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return getLocalDateString(d);
    });

    const stats = days.map(day => {
      const dayTxs = transactions.filter(tx => {
        const txDateLocal = tx.date.split('T')[0]; 
        return txDateLocal === day;
      });

      return { 
        day, 
        volume: dayTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
        count: dayTxs.length,
        isToday: day === today 
      };
    });

    const maxVolume = Math.max(...stats.map(s => s.volume), 1);
    
    return stats.map(s => ({
      ...s,
      // 💡 FIX 1: La barra máxima ahora es 70% (no 100%). 
      // Esto deja un 30% de aire arriba para que el Tooltip quepa perfectamente.
      // Altura mínima de 15% para que los días sin transacciones se vean bien.
      height: Math.max((s.volume / maxVolume) * 70, 15) 
    }));
  }, [transactions, mounted]);

  if (!mounted) return <div className="w-full h-full" />;

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    // 💡 FIX 2: pt-4 en lugar de pt-8 para centrar mejor
    <div className="flex items-end justify-between gap-1.5 w-full h-full relative z-10 pt-4">
      {weeklyData.map((data, i) => (
        <motion.div 
          key={data.day}
          initial={{ height: 0 }}
          animate={{ height: `${data.height}%` }}
          transition={{ delay: 0.1 + (i * 0.05), duration: 0.6, ease: "circOut" }}
          className={`
            flex-1 max-w-[28px] rounded-t-lg cursor-pointer group relative transition-all duration-300
            ${data.isToday 
              // 💡 FIX 3: Usamos colores semánticos del tema (bg-primary) en vez de blue-600
              ? 'bg-primary opacity-100 shadow-[0_0_15px_var(--color-primary)]' 
              : 'bg-primary/20 hover:bg-primary/80 opacity-100' 
            }
          `}
        >
          {/* 💡 FIX 4: Tooltip Posicionamiento Dinámico */}
          {/* Usamos 'bottom-full mb-2' en lugar de '-top-16'. Esto ancla el tooltip justo encima de la barra, sin importar qué tan alta sea. */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap shadow-2xl z-20 pointer-events-none flex flex-col items-center">
            
            <p className="text-[9px] font-black text-background/60 uppercase tracking-widest mb-0.5">
              {data.isToday ? "HOY" : dayNames[i]}
            </p>
            
            <p className="font-black text-sm tracking-tight font-mono">
              ${data.volume.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            
            {/* El triangulito de la flecha del tooltip */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-foreground rotate-45" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}