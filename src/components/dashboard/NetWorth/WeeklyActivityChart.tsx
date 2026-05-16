'use client'

import { motion } from 'framer-motion';
import { Transaction } from '@/types';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils'; // 💡 Importamos cn para manejar las clases limpiamente

export default function WeeklyActivityChart({ transactions }: { transactions: Transaction[] }) {
  const [mounted, setMounted] = useState(false);
  
  // 💡 1. NUEVO ESTADO: Rastreamos qué barra tiene el mouse encima
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`; 

    const dayOfWeek = curr.getDay() === 0 ? 6 : curr.getDay() - 1;
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return getLocalDateString(d);
    });

    const stats = days.map(dayStr => {
      
      const dayTxs = transactions.filter(tx => {
        const txDateOnly = tx.date.split('T')[0].split(' ')[0];
        return txDateOnly === dayStr;
      });

      const expenseTxs = dayTxs.filter(tx => tx.type === 'expense');

      return { 
        day: dayStr, 
        volume: expenseTxs.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0),
        count: expenseTxs.length,
        isToday: dayStr === today 
      };
    });

    const maxVolume = Math.max(...stats.map(s => s.volume), 1);
    
    return stats.map(s => ({
      ...s,
      height: Math.max((s.volume / maxVolume) * 70, 15) 
    }));
  }, [transactions, mounted]);

  if (!mounted) return <div className="w-full h-full" />;

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div 
      className="flex items-end justify-between gap-1.5 w-full h-full relative z-10 pt-4"
      // 💡 2. Si el cursor sale de toda la gráfica, volvemos a la vista por defecto (HOY)
      onMouseLeave={() => setHoveredIndex(null)} 
    >
      {weeklyData.map((data, i) => {
        
        // 💡 3. LÓGICA CENTRAL DE VISIBILIDAD:
        // Si el usuario está tocando ALGO, mostramos solo ese algo. 
        // Si NO está tocando nada (null), mostramos "HOY".
        const isTooltipVisible = hoveredIndex !== null ? hoveredIndex === i : data.isToday;

        return (
          <motion.div 
            key={data.day}
            initial={{ height: 0 }}
            animate={{ height: `${data.height}%` }}
            transition={{ delay: 0.1 + (i * 0.05), duration: 0.6, ease: "circOut" }}
            onMouseEnter={() => setHoveredIndex(i)} // 💡 Avisamos que entramos a esta barra
            className={cn(
              "flex-1 max-w-[28px] rounded-t-lg cursor-pointer relative transition-all duration-300",
              data.isToday 
                ? 'bg-primary opacity-100 shadow-[0_0_15px_var(--color-primary)]' 
                : 'bg-primary/20 hover:bg-primary/80 opacity-100' 
            )}
          >
            {/* 💡 4. TOOLTIP: Ya no usamos group-hover de CSS, obedece a React */}
            <div 
              className={cn(
                "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background p-2.5 rounded-xl whitespace-nowrap shadow-2xl z-20 pointer-events-none flex flex-col items-center transition-all duration-300",
                isTooltipVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
              )}
            >
              
              <p className="text-[9px] font-black text-background/60 uppercase tracking-widest mb-0.5">
                {data.isToday ? "HOY" : dayNames[i]}
              </p>
              
              <p className="font-black text-sm tracking-tight font-mono">
                ${data.volume.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
              
              {/* Flecha del tooltip */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-foreground rotate-45" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}