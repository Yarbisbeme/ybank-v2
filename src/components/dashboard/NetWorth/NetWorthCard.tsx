'use client'

import { motion, AnimatePresence } from 'framer-motion';
import { Account, Transaction } from '@/types';
import { useEffect, useState, useMemo } from 'react';
import WeeklyActivityChart from './WeeklyActivityChart';
import { CreditCard, Wallet } from 'lucide-react'; 


function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1000; // 2 segundos para que sea suave y no chocante
    const startValue = displayValue;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Aplicamos una función de "Ease Out" para que desacelere al llegar al final
      const easeOutQuad = (t: number) => t * (2 - t);
      const current = startValue + (value - startValue) * easeOutQuad(progress);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
}

export default function NetWorthCard({ accounts, transactions }: { accounts: Account[], transactions: Transaction[] }) {
  const [includeCredit, setIncludeCredit] = useState(false);

  const stats = useMemo(() => {
    // Filtramos las cuentas según el switch
    const filteredAccounts = includeCredit 
      ? accounts 
      : accounts.filter(a => a.type !== 'credit_card');

    const totalUSD = filteredAccounts
      .filter(a => a.currency === 'USD')
      .reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

    const totalDOP = filteredAccounts
      .filter(a => a.currency === 'DOP')
      .reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

    const groups = filteredAccounts.reduce((acc, account) => {
      const type = account.type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalUSD, totalDOP, groups };
  }, [accounts, includeCredit]);

  const typeLabels: Record<string, string> = {
    savings: 'Cuentas de Ahorro',
    credit_card: 'Tarjetas de Crédito',
    checking: 'Cuentas Corrientes',
    cash: 'Efectivo / Cash',
    investment: 'Inversiones'
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-8 rounded-[32px] border border-slate-100 flex flex-col md:flex-row justify-between items-stretch h-full w-full relative overflow-hidden"
    >
      <div className="space-y-6 z-10 w-full md:w-auto flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between md:justify-start gap-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              {includeCredit ? "Total Net Infrastructure" : "Liquid Capital Nodes"}
            </p>
            
            {/* Switch de Ingeniería */}
            <button 
              onClick={() => setIncludeCredit(!includeCredit)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all text-[9px] font-black uppercase tracking-tighter ${
                includeCredit 
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                : 'bg-white text-slate-400 border-slate-200 hover:border-blue-500'
              }`}
            >
              {includeCredit ? <CreditCard size={10} /> : <Wallet size={10} />}
              {includeCredit ? "Full Debt Analysis" : "Show Liabilities"}
            </button>
          </div>
          
          <div className="space-y-0">
            <h2 className={`text-5xl font-bold tracking-tighter flex items-baseline gap-2 transition-colors duration-500 ${stats.totalDOP < 0 ? 'text-red-500' : 'text-slate-900'}`}>
              <span className="text-blue-600">$</span>
              <AnimatedNumber value={stats.totalDOP} />
              <span className="text-lg text-slate-300 font-medium tracking-normal ml-1 text-slate-400">DOP</span>
            </h2>
            <p className="text-slate-400 font-medium text-xl tracking-tight italic">
              <AnimatedNumber value={stats.totalUSD} /> <span className="text-xs uppercase opacity-70">USD</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-slate-50">
          <AnimatePresence mode="popLayout">
            {Object.entries(stats.groups).map(([type, count]) => (
              <motion.div 
                key={type} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="min-w-[100px]"
              >
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none mb-1">
                  {typeLabels[type] || type}
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {count} <span className="text-[10px] font-medium text-slate-400 uppercase">Nodes</span>
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 md:mt-0 w-full md:w-80 h-full flex items-end self-stretch pt-10">
        <WeeklyActivityChart transactions={transactions} />
      </div>
    </motion.div>
  );
}