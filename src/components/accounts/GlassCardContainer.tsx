'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Share2, Edit, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { AnimatedNumber } from '../dashboard/NetWorth/AnimatedNumber';
import { Account } from '@/types';

interface GlassCardContainerProps {
  accounts: Account[];
  activeAccountId: string;
}

export default function GlassCardContainer({ accounts, activeAccountId }: GlassCardContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const initialIdx = accounts.findIndex(acc => acc.id === activeAccountId);
  const [currentIndex, setCurrentIndex] = useState(initialIdx !== -1 ? initialIdx : 0);

  const activeAccount = accounts[currentIndex];
  const institution = activeAccount?.institution;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < accounts.length - 1;

  // Color de fondo que cambiará suavemente
  const bgColor = activeAccount?.color || institution?.brand_color_primary || '#1664D9';

  // Sincronización silenciosa con la URL (Debounce)
  useEffect(() => {
    if (!activeAccount) return;
    const timeoutId = setTimeout(() => {
      if (activeAccountId !== activeAccount.id) {
        router.push(`?accountId=${activeAccount.id}`, { scroll: false });
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [currentIndex, activeAccount, activeAccountId, router]);

  // Navegación principal
  const navigateAccount = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < accounts.length) {
      setCurrentIndex(newIndex);
    }
  };

  // 💡 1. DETECCIÓN DE SWIPE (Móvil)
  const handleDragEnd = (e: any, info: PanInfo) => {
    const threshold = 40; // Sensibilidad del swipe
    if (info.offset.x < -threshold && hasNext) {
      navigateAccount('next');
    } else if (info.offset.x > threshold && hasPrev) {
      navigateAccount('prev');
    }
  };

  // 💡 2. DETECCIÓN DE SCROLL / TRACKPAD (Desktop)
  const lastScrollTime = useRef(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    // Prevenimos que un solo scroll dispare el cambio 10 veces (cooldown de 600ms)
    if (now - lastScrollTime.current < 600) return; 

    // Detectamos scroll horizontal o vertical
    if (e.deltaX > 20 || e.deltaY > 20) {
      if (hasNext) { navigateAccount('next'); lastScrollTime.current = now; }
    } else if (e.deltaX < -20 || e.deltaY < -20) {
      if (hasPrev) { navigateAccount('prev'); lastScrollTime.current = now; }
    }
  };

  if (!activeAccount) return null;

  return (
    <div 
      onWheel={handleWheel} // 👈 Escucha el scroll nativo aquí
      className="relative w-full overflow-hidden flex flex-col items-center justify-center pt-8 md:pt-12 pb-6 shadow-lg rounded-3xl gap-6 transition-colors duration-700 ease-in-out group"
      style={{ backgroundColor: bgColor }}
    >
      {/* Flechas Laterales */}
      <button
        onClick={() => navigateAccount('prev')}
        disabled={!hasPrev}
        className={`hidden md:flex absolute left-4 top-[30%] -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300
          ${!hasPrev ? 'opacity-0 pointer-events-none -translate-x-4' : 'opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:scale-110 active:scale-95'}
        `}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => navigateAccount('next')}
        disabled={!hasNext}
        className={`hidden md:flex absolute right-4 top-[30%] -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300
          ${!hasNext ? 'opacity-0 pointer-events-none translate-x-4' : 'opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:scale-110 active:scale-95'}
        `}
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Círculos geométricos de fondo */}
      <div className="absolute top-[15%] left-[20%] w-32 h-32 md:w-48 md:h-48 bg-white/10 rounded-full blur-[2px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[15%] w-40 h-40 md:w-56 md:h-56 bg-white/10 rounded-full blur-[2px] pointer-events-none"></div>

      {/* --- TARJETA ÚNICA (Framer Motion) --- */}
      <motion.div 
        drag="x" // Permite arrastrar solo horizontalmente
        dragConstraints={{ left: 0, right: 0 }} // Hace que regrese a su posición original
        dragElastic={0.15} // Efecto de resistencia al arrastrar
        onDragEnd={handleDragEnd}
        className="relative z-20 w-[90%] md:w-[70%] max-w-[380px] aspect-[1.586/1] rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] p-5 md:p-6 flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>

        {/* Fila Superior */}
        <div className="relative z-20 flex justify-between items-start">
          <div className="w-10 h-7 border border-white/50 rounded flex flex-col justify-between p-1 opacity-80 bg-white/10 backdrop-blur-sm pointer-events-none">
            <div className="w-full h-[1px] bg-white/50"></div>
            <div className="w-full flex justify-between">
              <div className="w-[1px] h-2 bg-white/50"></div>
              <div className="w-3 h-full border border-white/50 rounded-sm"></div>
              <div className="w-[1px] h-2 bg-white/50"></div>
            </div>
            <div className="w-full h-[1px] bg-white/50"></div>
          </div>
          
          {/* 💡 Textos Animados: AnimatePresence permite cruzar las opacidades */}
          <AnimatePresence mode="wait">
            <motion.span 
              key={`inst-${activeAccount.id}`}
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.2 }}
              className="text-white font-bold text-lg md:text-xl italic tracking-widest drop-shadow-sm uppercase"
            >
              {institution?.name || 'VISA'}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Fila Central: Número */}
        <div className="relative z-20">
          <AnimatePresence mode="wait">
            <motion.p 
              key={`num-${activeAccount.id}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="text-white text-base md:text-xl font-mono tracking-[0.15em] drop-shadow-md pointer-events-none"
            >
              {activeAccount.last_4_digits ? `•••• •••• •••• ${activeAccount.last_4_digits}` : '1234 5678 9012 3456'}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Fila Inferior */}
        <div className="relative z-20 flex justify-between items-end text-white">
          <div className="flex flex-col">
            <AnimatePresence mode="wait">
              <motion.span 
                key={`name-${activeAccount.id}`}
                initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} transition={{ duration: 0.2 }}
                className="uppercase text-[9px] md:text-[10px] tracking-widest font-mono opacity-90 truncate max-w-[140px] pointer-events-none"
              >
                {activeAccount.name || 'BALANCE OPERATIVO'}
              </motion.span>
            </AnimatePresence>
          </div>
          
          <div className="flex gap-3 text-[8px] md:text-[9px] uppercase tracking-widest font-mono pointer-events-none">
            <div className="flex flex-col items-center">
              <span className="opacity-60 scale-75 origin-bottom">Valid</span>
              <AnimatePresence mode="wait">
              </AnimatePresence>
            </div>
            <div className="flex flex-col items-center">
              <span className="opacity-60 scale-75 origin-bottom">Thru</span>
              <AnimatePresence mode="wait">
                <motion.span key={`thru-${activeAccount.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="opacity-90">
                  {activeAccount.expiry_date || '04/28'}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Paginación */}
      <div className="flex gap-2 z-20 mt-2">
        {accounts.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
          />
        ))}
      </div>

      {/* --- ACCOUNT DETAILS HEADER --- */}
      <div className="relative z-10 space-y-5 md:space-y-6 w-full flex flex-col items-center mt-2">
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-white/70 text-xs font-black uppercase tracking-[0.2em]">Current Balance</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-md">
            <span className="text-white/80 text-3xl mr-1">$</span>
            <AnimatedNumber value={Number(activeAccount.current_balance || 0)} />
            <AnimatePresence mode="wait">
              <motion.span 
                key={`curr-${activeAccount.id}`} 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm text-white/60 ml-2 uppercase"
              >
                {activeAccount.currency || 'USD'}
              </motion.span>
            </AnimatePresence>
          </h1>
          <p className="text-white/50 font-medium text-sm tracking-widest">
            •••• •••• •••• {activeAccount.last_4_digits || '0000'}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <ActionButton icon={<Plus size={20} />} label="Add" isLoading={loadingAction === 'add'} disabled={!!loadingAction} onClick={() => { setLoadingAction('add'); router.push(`?accountId=${activeAccount.id}&newTx=true`, { scroll: false }); setTimeout(() => setLoadingAction(null), 2000); }}/>
          <ActionButton icon={<Edit size={20} />} label="Edit" isLoading={loadingAction === 'edit'} disabled={!!loadingAction} onClick={() => { setLoadingAction('edit'); router.push(`?accountId=${activeAccount.id}&editAccountId=${activeAccount.id}`, { scroll: false }); setTimeout(() => setLoadingAction(null), 2000); }}/>
          <ActionButton icon={<Share2 size={20} />} label="Share" isLoading={loadingAction === 'share'} disabled={!!loadingAction} onClick={() => { setLoadingAction('share'); setTimeout(() => setLoadingAction(null), 1000); }}/>
        </div>
      </div>
    </div>
  );
}

// ... (El ActionButton sigue igual) ...
function ActionButton({ icon, label, isLoading, disabled, onClick }: { icon: React.ReactNode, label: string, isLoading?: boolean, disabled?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled || isLoading} className="flex flex-col items-center gap-2 group cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-all">
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 shadow-sm backdrop-blur-md ${isLoading ? 'bg-white/30 border-white/40 text-white' : 'bg-white/10 border-white/20 text-white md:hover:bg-white/20 md:hover:border-white/40 md:hover:scale-105 active:scale-95'}`}>
        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isLoading ? 'text-white' : 'text-white/70 md:group-hover:text-white'}`}>
        {isLoading ? '...' : label}
      </span>
    </button>
  );
}