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
  triggerRef?: React.RefObject<any>; // ✅ TypeScript feliz
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

  const setPreset = (start: Date, end: Date) => {
    if (mode === 'range') {
      setFilter?.('startDate', format(start, 'yyyy-MM-dd'));
      setFilter?.('endDate', format(end, 'yyyy-MM-dd'));
    } else {
      onChange?.(format(start, 'yyyy-MM-dd'));
    }
    onClose();
  };

  const CalendarUI = (
    <div className={cn("bg-card flex flex-col sm:flex-row w-full", inline ? "shadow-none border-none" : "sm:w-auto")}>
      <div className="flex flex-row sm:flex-col w-full sm:w-[130px] bg-surface-2/50 border-b sm:border-b-0 sm:border-r border-border p-2 gap-1 overflow-x-auto sm:overflow-x-visible scrollbar-hide">
        <p className="hidden sm:block text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground p-2 mb-1">Jump</p>
        <PresetBtn label="Hoy" onClick={() => setPreset(new Date(), new Date())} />
        <PresetBtn label="Ayer" onClick={() => setPreset(subDays(new Date(), 1), subDays(new Date(), 1))} />
        {mode === 'range' && (
          <>
            <PresetBtn label="Este Mes" onClick={() => setPreset(startOfMonth(new Date()), endOfMonth(new Date()))} />
            <PresetBtn label="Mes Pasado" onClick={() => setPreset(startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1)))} />
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
                  // Días fuera del mes
                  !isCurrentMonth && "text-muted-foreground/30 cursor-not-allowed",
                  // 💡 HOVER CORREGIDO: Usamos bg-primary/10 en lugar de estilos que oculten el texto
                  isCurrentMonth && !isSelectedSingle && !isSelectedStart && !isSelectedEnd && "hover:bg-primary/10 hover:text-primary text-foreground font-medium",
                  // Día de hoy
                  isToday && !isSelectedSingle && !isSelectedStart && "text-primary font-black underline underline-offset-2",
                  // Días seleccionados
                  (isSelectedSingle || isSelectedStart || isSelectedEnd) && "bg-primary text-white font-black z-10 shadow-sm scale-105",
                  // Rango intermedio
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
          /* === MÓVIL === */
          <div className="fixed inset-0 z-[99999] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={onClose} // Cierra al tocar el fondo oscuro
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
          /* === DESKTOP === */
          // 💡 BACKDROP INVISIBLE PARA DESKTOP
          <div className="fixed inset-0 z-[99999]">
            {/* Este div invisible detecta el clic fuera y cierra el calendario */}
            <div className="absolute inset-0" onClick={onClose} />
            
            <div 
              className="absolute"
              style={{ top: coords.top, left: coords.left }}
              onClick={(e) => e.stopPropagation()} // Previene que clics DENTRO del calendario lo cierren
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

function PresetBtn({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex-1 sm:flex-none text-left px-3 py-2 rounded-[6px] hover:bg-surface-2 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
      {label}
    </button>
  );
}