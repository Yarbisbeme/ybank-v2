'use client'

import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet } from 'lucide-react';
import { Transaction } from '@/types';
import { AnimatedNumber } from './AnimatedNumber';
import WeeklyActivityChart from './WeeklyActivityChart';

interface NetWorthDesktopProps {
  totalDOP: number;
  totalUSD: number;
  groups: Record<string, number>;
  includeCredit: boolean;
  onToggleCredit: () => void;
  transactions: Transaction[];
}

export default function NetWorthDesktop({
  totalDOP,
  totalUSD,
  groups,
  includeCredit,
  onToggleCredit,
  transactions
}: NetWorthDesktopProps) {
  
  const typeLabels: Record<string, string> = {
    savings: 'Cuentas de Ahorro',
    credit_card: 'Tarjetas de Crédito',
    checking: 'Cuentas Corrientes',
    cash: 'Efectivo / Cash',
    investment: 'Inversiones'
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-8 rounded-[32px] border border-slate-100 flex flex-row justify-between items-stretch gap-6 relative overflow-hidden h-full shadow-sm"
    >
      {/* Columna Izquierda: Datos y Grupos */}
      <div className="z-10 flex flex-col justify-between space-y-6 flex-1">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              {includeCredit ? "Total Net Infrastructure" : "Liquid Capital Cuentas"}
            </p>
            
            <button 
              onClick={onToggleCredit}
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
            <h2 className={`text-5xl font-bold tracking-tighter flex items-baseline gap-2 transition-colors duration-500 ${totalDOP < 0 ? 'text-rose-500' : 'text-slate-900'}`}>
              <span className="text-blue-600 font-black">$</span>
              <AnimatedNumber value={totalDOP} />
              <span className="text-lg text-slate-300 font-medium tracking-normal ml-1">DOP</span>
            </h2>
            <p className="text-slate-400 font-medium text-xl tracking-tight italic">
              <AnimatedNumber value={totalUSD} /> <span className="text-xs uppercase opacity-70">USD</span>
            </p>
          </div>
        </div>

        {/* Mapeo de Grupos (Nodes) */}
        <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-slate-50">
          <AnimatePresence mode="popLayout">
            {Object.entries(groups).map(([type, count]) => (
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

      {/* Columna Derecha: Gráfico Semanal */}
      <div className="w-80 flex items-end self-stretch pt-6">
        <WeeklyActivityChart transactions={transactions} />
      </div>
    </motion.div>
  );
}