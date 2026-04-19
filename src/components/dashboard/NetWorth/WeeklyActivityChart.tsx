'use client'

import { motion } from 'framer-motion';
import { Transaction } from '@/types';
import { useMemo } from 'react';

export default function WeeklyActivityChart({ transactions }: { transactions: Transaction[] }) {
  
  // 💡 1. HELPER: Genera la fecha en formato YYYY-MM-DD pero en HORA LOCAL, no en UTC
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString(new Date());

  const weeklyData = useMemo(() => {
    const curr = new Date();
    
    // Encontramos el Lunes de la semana actual de forma segura
    const dayOfWeek = curr.getDay() === 0 ? 6 : curr.getDay() - 1; // 0 = Lunes, 6 = Domingo
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    // Generamos el array de los 7 días en base al inicio de semana
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return getLocalDateString(d); // Guardamos la fecha localmente
    });

    const stats = days.map(day => {
      // 💡 2. Aseguramos que la fecha de la transacción también se compare en formato local
      const dayTxs = transactions.filter(tx => {
        // Convertimos el string de la DB (tx.date) a una fecha local antes de comparar
        const txDateLocal = getLocalDateString(new Date(tx.date));
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
  }, [transactions, today]);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="hidden md:flex items-end justify-between gap-1 w-full h-full relative z-10 pt-8">
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
          {/* TOOLTIP HÍBRIDO */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap shadow-2xl z-20 pointer-events-none border border-slate-800">
            <div className="flex flex-col items-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-1">
                {dayNames[i]} {data.isToday && "• TODAY"}
              </p>
              <p className="text-white font-black text-sm tracking-tight">
                ${data.volume.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] font-bold text-blue-400 opacity-80">
                {data.count} {data.count === 1 ? 'transaccion' : 'transacciones'}
              </p>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 rotate-45 border-r border-b border-slate-800" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}