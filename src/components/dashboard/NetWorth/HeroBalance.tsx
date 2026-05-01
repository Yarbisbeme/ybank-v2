'use client';

import { useState, useMemo } from 'react';
import { useYBankStore } from '@/store/useYBankStore';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown, CreditCard, Wallet, Loader2 } from 'lucide-react';
import { useAccounts, useTransactionsList } from '@/hooks/useCatalogs'; // 💡 1. Importamos los hooks
import { AnimatedNumber } from './AnimatedNumber';
import WeeklyActivityChart from './WeeklyActivityChart';

// 💡 2. Eliminamos las Props de datos. Ya no las necesitamos.
export default function HeroBalance() {
  const { currency, preferredRate, isCalculatingRate, setCurrency } = useYBankStore();
  const [includeCredit, setIncludeCredit] = useState(false);

  // 💡 3. Consumimos los datos de la caché
  const { data: accounts = [], isLoading: isLoadingAccs } = useAccounts();
  const { data: transactions = [], isLoading: isLoadingTx } = useTransactionsList([]);

  // 💡 4. LÓGICA FINANCIERA (Calculada en tiempo real)
  const totals = useMemo(() => {
    const liquid = accounts
      .filter(a => a.type !== 'credit_card')
      .reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);
    
    const debt = accounts
      .filter(a => a.type === 'credit_card')
      .reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

    return { liquid, debt };
  }, [accounts]);

  const totalDOP = includeCredit ? (totals.liquid - Math.abs(totals.debt)) : totals.liquid;
  
  const displayBalance = currency === 'USD' && preferredRate
    ? totalDOP / preferredRate.rate
    : totalDOP;

  const isNegative = displayBalance < 0;
  const absoluteBalance = Math.abs(displayBalance);

  // 5. TENDENCIA MENSUAL (Optimizado)
  const trend = useMemo(() => {
    if (transactions.length === 0) return { percentage: 0, isUp: true };
    const now = new Date();
    const currentMonth = now.getMonth();
    
    const currentMonthTotal = transactions
      .filter(tx => new Date(tx.date).getMonth() === currentMonth)
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const lastMonthTotal = transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return d.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1);
      })
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    if (lastMonthTotal === 0) return { percentage: 0, isUp: currentMonthTotal >= 0 };
    const diff = ((currentMonthTotal - lastMonthTotal) / Math.abs(lastMonthTotal)) * 100;
    return { percentage: Math.abs(Math.round(diff * 10) / 10), isUp: diff >= 0 };
  }, [transactions]);

  const TrendIcon = trend.isUp ? TrendingUp : TrendingDown;

  // 💡 6. Estado de carga elegante
  if (isLoadingAccs || isLoadingTx) {
    return (
      <div className="w-full h-[320px] bg-card animate-pulse rounded-[10px] border border-border flex items-center justify-center">
        <Loader2 className="animate-spin text-primary/30" size={32} />
      </div>
    );
  }

  return (
    <div className="relative w-full bg-card p-6 md:p-10 rounded-[10px] border border-border shadow-sm overflow-hidden group flex flex-col md:flex-row gap-8">
      {/* Glow Background - Muy sutil */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* COLUMNA IZQUIERDA: Balance y Controles */}
      <div className="relative z-10 flex flex-col justify-between flex-1 space-y-8">
        
        {/* Header y Toggle de Crédito */}
        <div className="flex items-center justify-between md:gap-4">
          <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={includeCredit ? 'net' : 'liquid'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {includeCredit ? "Patrimonio Neto Total" : "Capital Líquido"}
              </motion.span>
            </AnimatePresence>
            {isCalculatingRate && <RefreshCw size={12} className="ml-2 animate-spin text-blue-500" />}
          </div>
          
          <button 
            onClick={() => setIncludeCredit(!includeCredit)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-bold uppercase tracking-tight ${
              includeCredit 
              ? 'bg-foreground text-background border-foreground shadow-md' 
              : 'bg-background text-muted-foreground border-border hover:border-blue-500/30'
            }`}
          >
            <motion.div
              key={includeCredit ? 'credit' : 'wallet'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {includeCredit ? <CreditCard size={12} /> : <Wallet size={12} />}
            </motion.div>
            <span className="hidden sm:inline">{includeCredit ? "Ocultar Deuda" : "Incluir Deuda"}</span>
          </button>
        </div>

        {/* Balance Numérico */}
        <div className="space-y-3">
          <motion.h2 
            layout
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-mono tracking-tight flex items-baseline gap-1 md:gap-2 ${isNegative ? 'text-destructive' : 'text-foreground'}`}
          >
            <motion.span layout className="text-blue-600 font-sans text-3xl md:text-5xl shrink-0">
              {isNegative ? '-$' : '$'}
            </motion.span>
            <motion.span layout className="truncate">
              <AnimatedNumber value={absoluteBalance} />
            </motion.span>
          </motion.h2>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-2 p-1 rounded-lg border border-border relative">
              {(['DOP', 'USD'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`relative px-4 py-1.5 text-xs font-bold rounded-md transition-colors z-10 ${
                    currency === curr ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {currency === curr && (
                    <motion.div
                      layoutId="currency-toggle-pill"
                      className="absolute inset-0 bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.4)] rounded-md -z-10"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  {curr}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {currency === 'USD' && preferredRate && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  className="text-[10px] font-mono text-blue-600 bg-blue-500/10 px-2 py-1 rounded-md whitespace-nowrap"
                >
                  Rate: {preferredRate.rate} ({preferredRate.institutionName})
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Indicador de Tendencia */}
        <div className="flex items-center gap-2 mt-1 opacity-90">
          <span className={`flex items-center gap-1 font-mono text-sm font-bold tracking-tight ${
            trend.isUp ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            <TrendIcon size={16} strokeWidth={2.5} />
            {trend.isUp ? '+' : '-'}{trend.percentage}%
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            en relación al mes pasado
          </span>
        </div>
      </div>

      {/* COLUMNA DERECHA: Gráfico Semanal */}
      <div className="hidden md:flex w-72 flex-col justify-end border-l border-border pl-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Actividad Semanal</p>
        <div className="h-40 w-full">
          <WeeklyActivityChart transactions={transactions} />
        </div>
      </div>
    </div>
  );
}