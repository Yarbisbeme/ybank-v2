'use client'

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useYBankStore } from '@/store/useYBankStore';
import { Activity } from 'lucide-react';

interface FinancialHealthProps {
  baseLiquidDOP: number;
  baseDebtDOP: number;
}

export default function FinancialHealthCard({ baseLiquidDOP, baseDebtDOP }: FinancialHealthProps) {
  const { currency, preferredRate } = useYBankStore();

  const healthStats = useMemo(() => {
    const assets = baseLiquidDOP;
    const debt = Math.abs(baseDebtDOP);
    const total = assets + debt;

    if (total === 0) {
      return { score: 0, label: "PENDING", color: "bg-slate-500", text: "text-slate-400", debt };
    }

    const score = debt === 0 ? 100 : Math.round((assets / total) * 100);
    
    // 💡 Ajustamos los colores para que vibren mejor sobre un fondo oscuro
    let label = "ÓPTIMO";
    let color = "bg-blue-500";
    let text = "text-blue-400";
    
    if (score < 80) { label = "ESTABLE"; color = "bg-emerald-500"; text = "text-emerald-400"; }
    if (score < 50) { label = "ALERTA"; color = "bg-amber-500"; text = "text-amber-400"; }
    if (score < 30) { label = "CRÍTICO"; color = "bg-rose-500"; text = "text-rose-400"; }

    return { score, label, color, text, debt };
  }, [baseLiquidDOP, baseDebtDOP]);

  const displayDebt = currency === 'USD' && preferredRate 
    ? healthStats.debt / preferredRate.rate 
    : healthStats.debt;

  const formattedDebt = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 0
  }).format(displayDebt);

  return (
    // 💡 FIX 1: Fondo oscuro profundo (slate-950) con bordes sutiles (slate-800)
    <div className="bg-slate-950 p-6 md:p-8 rounded-[10px] border border-slate-800 h-full flex flex-col justify-between relative overflow-hidden shadow-xl group">
      
      {/* 💡 FIX 2: Aumentamos la opacidad del Glow (20%) para que resalte más en la oscuridad */}
      <div className={`absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-[80px] opacity-20 transition-colors duration-1000 ${healthStats.color}`} />

      {/* Header técnico */}
      <div className="space-y-1 relative z-10">
        <div className="flex justify-between items-center">
          {/* 💡 FIX 3: Textos secundarios en slate-400 */}
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <Activity size={14} className={healthStats.text} />
            Monitor de Salud
          </p>
          <span className={`text-[9px] font-black px-2 py-1 rounded-md ${healthStats.color} text-white tracking-widest shadow-lg`}>
            {healthStats.label}
          </span>
        </div>
      </div>

      {/* Visualización de Precisión */}
      <div className="py-6 space-y-4 relative z-10">
        <div className="flex justify-between items-end">
          {/* 💡 FIX 4: Texto principal en blanco puro */}
          <span className="text-6xl font-bold text-white font-mono tracking-tighter flex items-baseline">
            {healthStats.score}<span className="text-2xl text-slate-500 ml-1 font-sans">%</span>
          </span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2">
            Ratio de Capital
          </p>
        </div>
        
        {/* Barra de Progreso de Ingeniería */}
        <div className="h-2 w-full bg-slate-800/50 border border-slate-700/50 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${healthStats.score}%` }}
            transition={{ duration: 1.2, ease: "circOut", delay: 0.2 }}
            className={`h-full ${healthStats.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
          />
        </div>
      </div>

      {/* Reporte de Diagnóstico */}
      <div className="space-y-4 relative z-10">
        <div className="pt-4 border-t border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Reporte de Diagnóstico
          </p>
          {/* 💡 FIX 5: Texto de lectura en slate-300 para no cansar la vista */}
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {healthStats.debt > 0 
              ? <>Tu infraestructura depende de un <b className="text-white">{100 - healthStats.score}%</b> de capital externo. Tienes un pasivo actual de <span className={`font-mono font-bold ${healthStats.text}`}>{formattedDebt}</span>.</>
              : "Cero deuda detectada. Tu infraestructura de capital es 100% autosuficiente."}
          </p>
        </div>
      </div>
    </div>
  );
}