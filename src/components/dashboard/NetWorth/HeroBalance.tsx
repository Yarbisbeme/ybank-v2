'use client';

import { useState, useMemo } from 'react';
import { useYBankStore } from '@/store/useYBankStore';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown, CreditCard, Wallet } from 'lucide-react';
import { Account, Transaction } from '@/types';
import { AnimatedNumber } from './AnimatedNumber';
import WeeklyActivityChart from './WeeklyActivityChart';

interface HeroBalanceProps {
  accounts: Account[];
  transactions: Transaction[];
  baseLiquidDOP: number; 
  baseDebtDOP: number;   
}

export default function HeroBalance({ transactions, baseLiquidDOP, baseDebtDOP }: HeroBalanceProps) {
  const { currency, preferredRate, isCalculatingRate, setCurrency } = useYBankStore();
  const [includeCredit, setIncludeCredit] = useState(false);

  // 1. LÓGICA FINANCIERA
  const totalDOP = includeCredit ? (baseLiquidDOP - Math.abs(baseDebtDOP)) : baseLiquidDOP;
  const displayBalance = currency === 'USD' && preferredRate
    ? totalDOP / preferredRate.rate
    : totalDOP;

  // 💡 Extraemos si es negativo para manejar el signo menos limpiamente
  const isNegative = displayBalance < 0;
  const absoluteBalance = Math.abs(displayBalance);

  // 2. TENDENCIA MENSUAL
  const trend = useMemo(() => {
    if (transactions.length === 0) return { percentage: 0, isUp: true };
    const now = new Date();
    const currentMonth = now.getMonth();
    
    const currentMonthTotal = transactions
      .filter(tx => new Date(tx.date).getMonth() === currentMonth)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const lastMonthTotal = transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return d.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1);
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    if (lastMonthTotal === 0) return { percentage: 0, isUp: currentMonthTotal >= 0 };
    const diff = ((currentMonthTotal - lastMonthTotal) / Math.abs(lastMonthTotal)) * 100;
    return { percentage: Math.abs(Math.round(diff * 10) / 10), isUp: diff >= 0 };
  }, [transactions]);

  const TrendIcon = trend.isUp ? TrendingUp : TrendingDown;

  return (
    <div className="relative w-full bg-card p-6 md:p-10 rounded-[10px] border border-border shadow-sm overflow-hidden group flex flex-col md:flex-row gap-8">
      
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

      {/* COLUMNA IZQUIERDA: Balance y Controles */}
      <div className="relative z-10 flex flex-col justify-between flex-1 space-y-8">
        
        {/* Header y Toggle de Crédito */}
        <div className="flex items-center justify-between md:justify-start md:gap-4">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
            {includeCredit ? "Patrimonio Neto Total" : "Capital Líquido"}
            {isCalculatingRate && <RefreshCw size={12} className="ml-2 animate-spin text-primary" />}
          </p>
          
          <button 
            onClick={() => setIncludeCredit(!includeCredit)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-bold uppercase tracking-tight ${
              includeCredit 
              ? 'bg-foreground text-background border-foreground shadow-md' 
              : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {includeCredit ? <CreditCard size={12} /> : <Wallet size={12} />}
            <span className="hidden sm:inline">{includeCredit ? "Ocultar Deuda" : "Incluir Deuda"}</span>
          </button>
        </div>

        {/* 💡 FIX DE COLISIÓN: Balance Numérico */}
        <div className="space-y-3">
          {/* Cambiamos tracking-tighter a tracking-tight y añadimos responsive text (text-4xl a text-7xl) */}
          <h2 className={`text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-mono tracking-tight flex items-baseline gap-1 md:gap-2 ${isNegative ? 'text-destructive' : 'text-foreground'}`}>
            {/* El signo negativo vive aquí junto al dólar, no en el número animado */}
            <span className="text-primary font-sans text-3xl md:text-5xl shrink-0">
              {isNegative ? '-$' : '$'}
            </span>
            {/* Solo pasamos el valor absoluto a la animación */}
            <span className="truncate">
              <AnimatedNumber value={absoluteBalance} />
            </span>
          </h2>
          
          <div className="flex items-center gap-4">
            
            {/* 💡 ANIMACIÓN AÑADIDA: Toggle DOP / USD */}
            <div className="flex items-center bg-surface-2 p-1 rounded-lg border border-border relative">
              {(['DOP', 'USD'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`relative px-4 py-1.5 text-xs font-bold rounded-md transition-colors z-10 ${
                    currency === curr ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {/* La "píldora" mágica que se desliza */}
                  {currency === curr && (
                    <motion.div
                      layoutId="currency-toggle-pill"
                      className="absolute inset-0 bg-background shadow-sm rounded-md border border-border/50 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {curr}
                </button>
              ))}
            </div>

            {/* Etiqueta de Tasa Inteligente */}
            <AnimatePresence>
              {currency === 'USD' && preferredRate && (
                <motion.span 
                  initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }} 
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} 
                  exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                  className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 rounded-md whitespace-nowrap"
                >
                  Rate: {preferredRate.rate} ({preferredRate.institutionName})
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Indicador de Tendencia */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border w-max ${
          trend.isUp ? 'bg-success-600/10 border-success-600/20 text-success-600' : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          <TrendIcon size={14} strokeWidth={3} />
          <span className="text-xs font-bold font-mono">
            {trend.percentage}% <span className="font-sans font-medium opacity-80 uppercase text-[10px]">vs mes anterior</span>
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