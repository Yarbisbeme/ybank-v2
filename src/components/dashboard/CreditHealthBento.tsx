'use client'

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Account } from '@/types';
import { ShieldCheck, AlertTriangle, CalendarClock, Zap } from 'lucide-react';
import { useYBankStore } from '@/store/useYBankStore';

export default function CreditHealthBento({ accounts }: { accounts: Account[] }) {
  const { currency, preferredRate } = useYBankStore();

  const creditStats = useMemo(() => {
    // 1. Filtramos tarjetas
    const cards = accounts.filter(a => a.type === 'credit_card' && a.is_active);
    if (cards.length === 0) return null;

    // 2. Métricas
    const totalLimit = cards.reduce((sum, a) => sum + (Number(a.credit_limit) || 0), 0);
    const totalUsed = cards.reduce((sum, a) => sum + Math.abs(Number(a.current_balance) || 0), 0);
    const totalAvailable = totalLimit - totalUsed;
    
    const utilization = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
    
    // 3. Próximo Corte
    const today = new Date().getDate();
    const nearestCutoff = cards.reduce((prev, curr) => {
      const day = curr.cutoff_day || 30;
      const diff = day > today ? day - today : (30 - today) + day;
      return diff < prev ? diff : prev;
    }, 31);

    return { utilization, nearestCutoff, totalAvailable, cardCount: cards.length };
  }, [accounts]);

  if (!creditStats) return null;

  // Conversión de moneda para el crédito disponible
  const displayAvailable = currency === 'USD' && preferredRate 
    ? creditStats.totalAvailable / preferredRate.rate 
    : creditStats.totalAvailable;

  const formattedAvailable = new Intl.NumberFormat('en-US', { 
    style: 'currency', currency: currency, minimumFractionDigits: 0
  }).format(displayAvailable);

  // LÓGICA DE ASESORAMIENTO Y ESTADOS
  const isHealthy = creditStats.utilization <= 30;
  const isWarning = creditStats.utilization > 30 && creditStats.utilization < 60;
  
  let insightMessage = "";
  if (creditStats.nearestCutoff <= 5 && creditStats.utilization > 0) {
    insightMessage = `Tu corte es en ${creditStats.nearestCutoff} días. Deja de usar la tarjeta y prepárate para pagar el balance.`;
  } else if (!isHealthy && !isWarning) {
    insightMessage = "Peligro para tu Score. Estás maximizando tus límites. Realiza abonos antes del corte.";
  } else if (isWarning) {
    insightMessage = "Estás pasando el 30% recomendado. Modera tus gastos a crédito para proteger tu historial.";
  } else {
    insightMessage = "Excelente manejo. Mantener tu uso bajo el 30% asegura la mejor calificación crediticia.";
  }

  // 💡 Paleta de Colores Dinámica (Ajustada para legibilidad en Dark Mode)
  const theme = isHealthy 
    ? { text: 'text-white', bg: 'bg-white', badgeBg: 'bg-blue-600', badgeText: 'text-white' }
    : isWarning 
    ? { text: 'text-amber-400', bg: 'bg-amber-500', badgeBg: 'bg-amber-500/20', badgeText: 'text-amber-400' }
    : { text: 'text-rose-400', bg: 'bg-rose-500', badgeBg: 'bg-rose-500/20', badgeText: 'text-rose-400' };

  return (
    // 💡 Dark Mode, Bordes a 10px
    <div className="bg-slate-950 p-6 rounded-[10px] border border-slate-800 h-full flex flex-col justify-between group relative overflow-hidden transition-colors hover:border-slate-700">
      
      {/* Header técnico */}
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-2 text-slate-400">
          <Zap size={16} className="opacity-70" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Score Shield</span>
        </div>
        <div className={`px-2 py-1 rounded-[6px] text-[9px] font-black tracking-widest uppercase shadow-sm ${theme.badgeBg} ${theme.badgeText}`}>
          {isHealthy ? 'ÓPTIMO' : isWarning ? 'ELEVADO' : 'RIESGO'}
        </div>
      </div>

      {/* Main Metric */}
      <div className="mt-6 relative z-10 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-5xl font-mono font-bold text-white tracking-tighter">
              {creditStats.utilization}<span className="text-2xl text-slate-500 ml-1 font-sans">%</span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Uso del Límite
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-mono font-bold text-white">{formattedAvailable}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Crédito Disponible</p>
          </div>
        </div>
        
        {/* 💡 Progress Bar Flat (Sin sombra interna) */}
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${creditStats.utilization}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className={`h-full ${theme.bg}`}
          />
        </div>
      </div>

      {/* Insight Crediticio Proactivo */}
      <div className="mt-6 relative z-10">
        {/* 💡 Fondo de la caja de asesoramiento ajustado para contrastar con el fondo oscuro principal */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex gap-3 items-start">
          <div className="mt-0.5">
            {creditStats.nearestCutoff <= 5 ? (
               <CalendarClock size={16} className="text-amber-500" />
            ) : isHealthy ? (
               <ShieldCheck size={16} className="text-blue-500" />
            ) : (
               <AlertTriangle size={16} className={theme.text} />
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              {creditStats.nearestCutoff <= 5 ? `Corte en ${creditStats.nearestCutoff} días` : 'Asesor crediticio'}
            </p>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {insightMessage}
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}