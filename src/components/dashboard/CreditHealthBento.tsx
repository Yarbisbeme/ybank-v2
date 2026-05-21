'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, CalendarClock, Zap, Loader2 } from 'lucide-react';
import { useYBankStore } from '@/store/useYBankStore';
import { useAccounts } from '@/hooks/useCatalogs';

export default function CreditHealthBento() {
  const { currency, preferredRate } = useYBankStore();
  
  // Consumimos los datos de la caché global
  const { data: accounts = [], isLoading } = useAccounts();

  // 💡 1. Separamos el filtro de tarjetas para poder usarlo en las validaciones
  const cards = useMemo(() => accounts.filter(a => a.type === 'credit_card' && a.is_active), [accounts]);

  // 💡 2. VALIDACIÓN DE SEGURIDAD: ¿Necesitamos la tasa de cambio?
  // Verificamos si alguna de las tarjetas tiene una moneda diferente a la moneda global elegida.
  const hasMixedCurrencies = cards.some(c => c.currency !== currency);
  
  // Si hay monedas mezcladas, pero Zustand aún no nos ha entregado la tasa, estamos ciegos.
  const isWaitingForRate = hasMixedCurrencies && (!preferredRate || !preferredRate.rate);

  // 💡 3. Actualizamos la condición de carga para incluir la espera de la tasa de cambio
  const isActuallyLoading = (isLoading && accounts.length === 0) || isWaitingForRate;

  const creditStats = useMemo(() => {
    // Si estamos cargando o esperando la tasa, no calculamos nada aún para evitar números locos
    if (cards.length === 0 || isWaitingForRate) return null;

    let totalLimit = 0;
    let totalUsed = 0;

    cards.forEach(card => {
      let rateMultiplier = 1;
      
      // Si entra aquí, estamos 100% seguros de que preferredRate.rate existe
      if (preferredRate && preferredRate.rate) {
        if (currency === 'DOP' && card.currency === 'USD') {
          rateMultiplier = preferredRate.rate; 
        } else if (currency === 'USD' && card.currency === 'DOP') {
          rateMultiplier = 1 / preferredRate.rate; 
        }
      }

      const limit = Number(card.credit_limit) || 0;
      totalLimit += (limit * rateMultiplier);

      const balance = Number(card.current_balance) || 0;
      if (balance < 0) {
         totalUsed += (Math.abs(balance) * rateMultiplier);
      }
    });

    const totalAvailable = totalLimit - totalUsed;
    const utilization = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
    
    const today = new Date().getDate();
    const nearestCutoff = cards.reduce((prev, curr) => {
      const day = curr.cutoff_day || 30;
      const diff = day > today ? day - today : (30 - today) + day;
      return diff < prev ? diff : prev;
    }, 31);

    return { utilization, nearestCutoff, totalAvailable, cardCount: cards.length };
  }, [cards, currency, preferredRate, isWaitingForRate]);

  if (isActuallyLoading) {
    return (
      <div className="bg-card p-6 rounded-[10px] border border-border h-full animate-pulse flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-primary/20" size={24} />
      </div>
    );
  }

  if (!creditStats) {
    return (
      <div className="bg-card p-6 rounded-[10px] border border-dashed border-border h-full flex flex-col justify-center items-center text-center opacity-70">
        <ShieldCheck size={32} className="text-muted-foreground mb-3 opacity-50" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Score Shield</p>
        <p className="text-[10px] text-muted-foreground mt-1">No se detectaron tarjetas de crédito activas.</p>
      </div>
    );
  }

  // 💡 FIX: Como ya unificamos todas las monedas dentro del useMemo en base al 'currency' global, 
  // ya no necesitamos hacer la conversión aquí abajo. El totalAvailable ya está en la moneda correcta.
  const formattedAvailable = new Intl.NumberFormat('en-US', { 
    style: 'currency', currency: currency, minimumFractionDigits: 0
  }).format(creditStats.totalAvailable);

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

  const theme = isHealthy 
    ? { text: 'text-foreground', bg: 'bg-foreground', badgeBg: 'bg-blue-600' }
    : isWarning 
    ? { text: 'text-amber-500', bg: 'bg-amber-500', badgeBg: 'bg-amber-500' }
    : { text: 'text-rose-500', bg: 'bg-rose-500', badgeBg: 'bg-rose-500' };

  return (
    <div className="bg-card p-6 rounded-[10px] border border-border h-full flex flex-col justify-between group relative overflow-hidden shadow-sm transition-colors hover:border-primary/50">
      
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap size={16} className={theme.text} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Score Shield</span>
        </div>
        <div className={`px-2 py-1 rounded-md text-[9px] font-black tracking-widest uppercase ${theme.badgeBg} text-white`}>
          {isHealthy ? 'ÓPTIMO' : isWarning ? 'ELEVADO' : 'RIESGO'}
        </div>
      </div>

      <div className="mt-6 relative z-10 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-5xl font-mono font-bold text-foreground tracking-tighter">
              {creditStats.utilization}<span className="text-2xl text-muted-foreground ml-1 font-sans">%</span>
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Uso del Límite
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-mono font-bold text-foreground">{formattedAvailable}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Crédito Disponible</p>
          </div>
        </div>
        
        <div className="h-2 w-full bg-surface-2 border border-border rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${creditStats.utilization}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className={`h-full ${theme.bg} shadow-[inset_0_1px_3px_rgba(255,255,255,0.3)]`}
          />
        </div>
      </div>

      <div className="mt-6 relative z-10">
        <div className="bg-surface-2 border border-border p-3.5 rounded-xl flex gap-3 items-start">
          <div className="mt-0.5">
            {creditStats.nearestCutoff <= 5 ? (
               <CalendarClock size={16} className="text-amber-500" />
            ) : isHealthy ? (
               <ShieldCheck size={16} className="text-foreground" />
            ) : (
               <AlertTriangle size={16} className={theme.text} />
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              {creditStats.nearestCutoff <= 5 ? `Corte en ${creditStats.nearestCutoff} días` : 'Asesor crediticio'}
            </p>
            <p className="text-xs text-foreground/80 font-medium leading-relaxed">
              {insightMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}