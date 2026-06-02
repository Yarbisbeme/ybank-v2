'use client'

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, subDays 
} from 'date-fns';
import { es } from 'date-fns/locale';

interface YBankCalendarProps {
  isOpen: boolean; 
  mode: 'single' | 'range'; 
  triggerRef?: React.RefObject<any>; 
  inline?: boolean; 
  value?: string | null; 
  onChange?: (date: string) => void;
  startDate?: string | null;
  endDate?: string | null;
  setFilter?: (key: "startDate" | "endDate", value: string | null) => void;
  onClose: () => void;
}

export default function YBankCalendarPicker({ 
  isOpen,
  mode, triggerRef, inline = false, value, onChange, 
  startDate, endDate, setFilter, 
  onClose 
}: YBankCalendarProps) {
  
  const initialDate = mode === 'single' 
    ? (value ? new Date(value + 'T00:00:00') : new Date())
    : (startDate ? new Date(startDate + 'T00:00:00') : new Date());
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile && triggerRef?.current && !inline && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      let safeLeft = rect.left;
      const calendarWidth = 320; 

      if (safeLeft + calendarWidth > window.innerWidth) {
        safeLeft = window.innerWidth - calendarWidth - 20; 
      }
      setCoords({ top: rect.bottom + 8, left: safeLeft });
    }
  }, [isMobile, triggerRef, inline, isOpen]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  });

  const handleDateClick = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    if (mode === 'single') {
      onChange?.(dayStr);
      onClose();
    } else {
      if (!startDate || (startDate && endDate)) {
        setFilter?.('startDate', dayStr);
        setFilter?.('endDate', null);
      } else {
        const start = new Date(startDate + 'T00:00:00');
        if (day < start) setFilter?.('startDate', dayStr); 
        else { setFilter?.('endDate', dayStr); onClose(); }
      }
    }
  };

  const setPreset = (start: Date | null, end: Date | null) => {
    if (mode === 'range') {
      setFilter?.('startDate', start ? format(start, 'yyyy-MM-dd') : null);
      setFilter?.('endDate', end ? format(end, 'yyyy-MM-dd') : null);
    } else {
      onChange?.(start ? format(start, 'yyyy-MM-dd') : '');
    }
    onClose()
  };

  // 💡 LÓGICA DE DETECCIÓN DE PRESETS ACTIVOS
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const thisMonthStartStr = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const thisMonthEndStr = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const lastMonthStartStr = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
  const lastMonthEndStr = format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');

  const isHoyActive = mode === 'single' ? value === todayStr : (startDate === todayStr && endDate === todayStr);
  const isAyerActive = mode === 'single' ? value === yesterdayStr : (startDate === yesterdayStr && endDate === yesterdayStr);
  const isEsteMesActive = mode === 'range' && startDate === thisMonthStartStr && endDate === thisMonthEndStr;
  const isMesPasadoActive = mode === 'range' && startDate === lastMonthStartStr && endDate === lastMonthEndStr;

  const CalendarUI = (
    <div className={cn("bg-card flex flex-col sm:flex-row w-full", inline ? "shadow-none border-none" : "sm:w-auto")}>
      <div className="flex flex-row sm:flex-col w-full sm:w-[130px] bg-surface-2/50 border-b sm:border-b-0 sm:border-r border-border p-2 gap-1 overflow-x-auto sm:overflow-x-visible scrollbar-hide">
        <p className="hidden sm:block text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground p-2 mb-1">Jump</p>
        
        <PresetBtn 
          label="Hoy" 
          isActive={isHoyActive} 
          onClick={() => {
            if (isHoyActive) setPreset(null, null); // Si ya estaba activo, lo limpia
            else setPreset(new Date(), new Date());
          }} 
        />
        <PresetBtn 
          label="Ayer" 
          isActive={isAyerActive} 
          onClick={() => {
            if (isAyerActive) setPreset(null, null);
            else setPreset(subDays(new Date(), 1), subDays(new Date(), 1));
          }} 
        />
        {mode === 'range' && (
          <>
            <PresetBtn 
              label="Este Mes" 
              isActive={isEsteMesActive} 
              onClick={() => {
                if (isEsteMesActive) setPreset(null, null);
                else setPreset(startOfMonth(new Date()), endOfMonth(new Date()));
              }} 
            />
            <PresetBtn 
              label="Mes Pasado" 
              isActive={isMesPasadoActive} 
              onClick={() => {
                if (isMesPasadoActive) setPreset(null, null);
                else setPreset(startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1)));
              }} 
            />
          </>
        )}
      </div>

      <div className="p-4 w-full sm:w-[280px] bg-card">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-surface-2 rounded-[4px] text-muted-foreground transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
          <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-surface-2 rounded-[4px] text-muted-foreground transition-colors"><ChevronRight size={16} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-center text-[9px] font-black text-muted-foreground/40">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, i) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            
            const isSelectedSingle = mode === 'single' && value === dayStr;
            const isSelectedStart = mode === 'range' && startDate === dayStr;
            const isSelectedEnd = mode === 'range' && endDate === dayStr;
            const isWithinRange = mode === 'range' && startDate && endDate && day > new Date(startDate + 'T00:00:00') && day < new Date(endDate + 'T00:00:00');

            return (
              <button
                key={i} type="button" onClick={() => handleDateClick(day)} disabled={!isCurrentMonth}
                className={cn(
                  "h-8 flex items-center justify-center text-[11px] font-mono transition-all relative rounded-[6px]",
                  !isCurrentMonth && "text-muted-foreground/30 cursor-not-allowed",
                  isCurrentMonth && !isSelectedSingle && !isSelectedStart && !isSelectedEnd && "hover:bg-primary/10 hover:text-primary text-foreground font-medium",
                  isToday && !isSelectedSingle && !isSelectedStart && "text-primary font-black underline underline-offset-2",
                  (isSelectedSingle || isSelectedStart || isSelectedEnd) && "bg-primary text-white font-black z-10 shadow-sm scale-105",
                  isWithinRange && "bg-primary/10 text-primary rounded-none",
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  if (inline) return isOpen ? CalendarUI : null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        isMobile ? (
          <div className="fixed inset-0 z-[99999] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={onClose} 
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full bg-card rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mt-4 mb-2 shrink-0" />
              <div className="w-full pb-6"> 
                {CalendarUI}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="fixed inset-0 z-[99999]">
            <div className="absolute inset-0" onClick={onClose} />
            <div 
              className="absolute"
              style={{ top: coords.top, left: coords.left }}
              onClick={(e) => e.stopPropagation()} 
            >
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="shadow-[0_12px_40px_-12px_rgba(0,0,0,0.3)] rounded-[12px] border border-border overflow-hidden bg-card"
              >
                {CalendarUI}
              </motion.div>
            </div>
          </div>
        )
      )}
    </AnimatePresence>,
    document.body
  );
}

function PresetBtn({ label, isActive, onClick }: { label: string, isActive?: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-1 sm:flex-none flex items-center justify-center sm:justify-start px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] rounded-[6px] transition-all z-10 whitespace-nowrap overflow-hidden",
        isActive ? "text-white" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      )}
    >
      <AnimatePresence>
      {isActive && (
        <motion.div 
          layoutId="calendar-active-pill"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-primary shadow-sm rounded-[6px] -z-10 overflow-hidden"
        >
          <motion.div
            key={`wave-container-${label}`} 
            initial={{ y: '130%' }}
            animate={{ y: '-25%' }}
            transition={{ y: { duration: 0.9, ease: 'backOut' } }}
            className="absolute inset-0 z-10 h-[200%] w-[160%] origin-bottom-left rotate-[-8deg]"
          >
            <motion.div
              animate={{ x: ['-40%', '0%', '-40%'] }}
              transition={{ 
                repeat: Infinity, 
                duration: 4, 
                ease: 'easeInOut' 
              }}
              className="absolute inset-0 h-full w-full"
            >
              {/* 💡 FIX: Tonos claros en las capas para mantener el efecto fluido visible */}
              <WaveLayer color="var(--wave-1)" className="opacity-40" /> 
              <WaveLayer color="var(--wave-2)" className="opacity-80 translate-y-1" />
              <div className="absolute -bottom-[98%] left-0 h-full w-full bg-[var(--wave-2)]" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <span className="relative z-30">{label}</span>
    </button>
  );
}
// ==========================================
// COMPONENTES DE ONDA (WAVE ANIMATION)
// ==========================================

function WaveLayer({
  color,
  className = "",
}: {
  color: string;
  className?: string;
}) {
  return (
    <div className={`absolute bottom-0 left-0 h-full w-[200%] ${className}`}>
      <WavePath color={color} />
    </div>
  );
}

function WavePath({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className="absolute bottom-0 h-[60px] w-full" 
    >
      <path
        d="M0,0 V20 Q300,110 600,20 T1200,20 V120 H0 Z"
        fill={color}
        transform="scale(1,-1) translate(0,-120)"
      />
    </svg>
  );
}