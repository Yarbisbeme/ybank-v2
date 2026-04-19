'use client'

import { useMemo } from 'react';
import { Account } from '@/types';
import { motion } from 'framer-motion';

export default function FinancialHealthCard({ accounts = [] }: { accounts?: Account[] }) {
  
  const healthStats = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return { score: 0, label: "PENDING", color: "bg-slate-500", debt: 0 };
    }

    const assets = accounts
      .filter(a => a.current_balance > 0)
      .reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);
    const debt = accounts
      .filter(a => a.current_balance < 0)
      .reduce((sum, a) => sum + Math.abs(Number(a.current_balance) || 0), 0);

    const score = debt === 0 ? 100 : Math.round((assets / (assets + debt)) * 100);
    
    let label = "OPTIMAL";
    let color = "bg-blue-600";
    if (score < 80) { label = "STABLE"; color = "bg-blue-400"; }
    if (score < 50) { label = "WARNING"; color = "bg-amber-500"; }
    if (score < 30) { label = "CRITICAL"; color = "bg-red-600"; }

    return { score, label, color, debt };
  }, [accounts]);

  return (
    <div className="bg-black p-8 rounded-[12px] border border-white/10 h-full flex flex-col justify-between relative overflow-hidden">
      {/* Header técnico */}
      <div className="space-y-1">
        <div className="flex justify-between items-baseline">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
            Health Monitoring
          </p>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm ${healthStats.color} text-white`}>
            {healthStats.label}
          </span>
        </div>
      </div>

      {/* Visualización de Precisión (Barra Lineal en lugar de Círculo) */}
      <div className="py-8 space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-6xl font-bold text-white tracking-tighter">
            {healthStats.score}<span className="text-lg text-slate-600 ml-1 font-medium">%</span>
          </span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-2">
            Equity Ratio
          </p>
        </div>
        
        {/* Barra de Progreso de Ingeniería */}
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${healthStats.score}%` }}
            transition={{ duration: 1, ease: "circOut" }}
            className={`h-full ${healthStats.color}`}
          />
        </div>
      </div>

      {/* Reporte de Diagnóstico */}
      <div className="space-y-4">
        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Diagnostic Report</p>
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
            {healthStats.debt > 0 
              ? `Operational infrastructure is dependent on ${100 - healthStats.score}% external debt nodes. Optimization recommended.` 
              : "Zero debt detected. Capital infrastructure is 100% self-sufficient."}
          </p>
        </div>
      </div>
    </div>
  );
}