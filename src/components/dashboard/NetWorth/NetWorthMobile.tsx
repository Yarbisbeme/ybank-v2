'use client'

import React, { useMemo } from 'react';
import { CreditCard, Wallet, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import { Transaction } from '@/types';
import { AnimatedNumber } from './AnimatedNumber';
import { motion } from 'framer-motion';

interface NetWorthMobileProps {
  totalDOP: number;
  totalUSD: number;
  includeCredit: boolean;
  onToggleCredit: () => void;
  transactions: Transaction[];
}

export default function NetWorthMobile({
  totalDOP,
  totalUSD,
  includeCredit,
  onToggleCredit,
  transactions
}: NetWorthMobileProps) {
  
  // 💡 Tamaño de fuente dinámico para evitar desbordes
  const getFontSize = (value: number) => {
    const len = Math.abs(Math.round(value)).toString().length;
    if (len > 9) return 'text-2xl';
    if (len > 6) return 'text-3xl';
    return 'text-4xl';
  };

  // 💡 Cálculo de tendencia real (Dinámico)
  const trend = useMemo(() => {
    if (transactions.length === 0) return { percentage: 0, isUp: true };
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTotal = transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const lastMonthTotal = transactions
      .filter(tx => {
        const d = new Date(tx.date);
        const lastM = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastY = currentMonth === 0 ? currentYear - 1 : currentYear;
        return d.getMonth() === lastM && d.getFullYear() === lastY;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    if (lastMonthTotal === 0) return { percentage: 0, isUp: currentMonthTotal >= 0 };
    const diff = ((currentMonthTotal - lastMonthTotal) / Math.abs(lastMonthTotal)) * 100;
    return { percentage: Math.abs(Math.round(diff * 10) / 10), isUp: diff >= 0 };
  }, [transactions]);

  const trendColor = trend.isUp ? 'emerald' : 'rose';
  const TrendIcon = trend.isUp ? TrendingUp : TrendingDown;

  return (
    <div className="w-full bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative">
      <div className="flex justify-between items-start">
        
        {/* INFO FINANCIERA */}
        <div className="space-y-2 flex-1">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.18em]">
            {includeCredit ? "Total Liabilities" : "Liquid Assets"}
          </p>
          
          <div className="space-y-1">
            <h2 className={`
              ${getFontSize(totalDOP)} 
              font-black tracking-tighter flex items-baseline gap-1 transition-colors duration-300
              ${totalDOP < 0 ? 'text-rose-600' : 'text-slate-900'}
            `}>
              <span className="text-blue-600 text-xl font-black">$</span>
              <AnimatedNumber value={totalDOP} />
              <span className="text-[10px] text-slate-500 font-black uppercase ml-0.5">DOP</span>
            </h2>
            
            <div className="flex items-center gap-2.5">
              <div className={`flex items-center gap-1.5 text-${trendColor}-600 bg-${trendColor}-50/70 px-2 py-0.5 rounded-full border border-${trendColor}-100`}>
                <TrendIcon size={10} strokeWidth={3} />
                <span className="text-[9px] font-black">
                  {trend.percentage}%
                </span>
              </div>
              <p className="text-slate-400 font-extrabold text-[11px]">
                <AnimatedNumber value={totalUSD} /> <span className="text-[8px] opacity-60 uppercase">USD</span>
              </p>
            </div>
          </div>
        </div>

        {/* BOTÓN SWITCH SIMPLE */}
        <button 
          onClick={onToggleCredit}
          className={`
            relative flex items-center justify-center w-12 h-12 rounded-2xl border transition-all duration-300
            ${includeCredit 
              ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
              : 'bg-slate-50 border-slate-100 text-slate-400'
            }
          `}
        >
          <motion.div
            key={includeCredit ? 'credit' : 'wallet'}
            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {includeCredit ? <Landmark size={20} /> : <Wallet size={20} />}
          </motion.div>
          
          {/* Indicador visual de estado activo */}
          {includeCredit && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-white rounded-full" />
          )}
        </button>

      </div>
    </div>
  );
}