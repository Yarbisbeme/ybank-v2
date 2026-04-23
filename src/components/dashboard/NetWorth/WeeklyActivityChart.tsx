'use client'

import { motion } from 'framer-motion';
import { Transaction } from '@/types';
import { useMemo, useState, useEffect } from 'react';

export default function WeeklyActivityChart({ transactions }: { transactions: Transaction[] }) {
  // 💡 SOLUCIÓN: Estado para montar el componente solo en el cliente
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
    if (!mounted) return []; // No calculamos nada hasta estar en el cliente

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
        // 💡 SOLUCIÓN: Extraemos "YYYY-MM-DD" directamente del texto de la base de datos.
        // Si viene con hora (T), la cortamos. Así el navegador no le resta 4 horas.
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
      height: Math.max((s.volume / maxVolume) * 100, 8) 
    }));
  }, [transactions, mounted]);

  // Si no está montado, devolvemos un placeholder vacío del mismo tamaño para evitar saltos visuales
  if (!mounted) return <div className="w-full h-full" />;

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    // 💡 Quitamos 'hidden md:flex' para que sea vea en móvil también como querías
    <div className="flex items-end justify-between gap-1 w-full h-full relative z-10 pt-8">
      {weeklyData.map((data, i) => (
        <motion.div 
          key={data.day}
          initial={{ height: 0 }}
          animate={{ height: `${data.height}%` }}
          transition={{ delay: 0.1 + (i * 0.05), duration: 0.6, ease: "circOut" }}
          className={`
            flex-1 max-w-[24px] rounded-t-lg cursor-pointer group relative transition-all duration-300
            ${data.isToday 
              ? 'bg-blue-600 opacity-100 shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
              : 'bg-blue-400 opacity-10 hover:opacity-100 hover:bg-blue-600' 
            }
          `}
        >
          {/* TOOLTIP (Se mantiene igual) */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap shadow-2xl z-20 pointer-events-none border border-slate-800">
            <div className="flex flex-col items-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-1">
                {dayNames[i]} {data.isToday && "• TODAY"}
              </p>
              <p className="text-white font-black text-sm tracking-tight">
                ${data.volume.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 rotate-45 border-r border-b border-slate-800" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}