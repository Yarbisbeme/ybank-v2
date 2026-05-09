// components/filters/YBankCalendar.tsx
'use client'

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, subDays 
} from 'date-fns';
import { es } from 'date-fns/locale';

interface YBankCalendarProps {
  startDate: string | null;
  endDate: string | null;
  setFilter: (key: "startDate" | "endDate", value: string | null) => void;
  onClose: () => void;
}

export default function YBankCalendar({ startDate, endDate, setFilter, onClose }: YBankCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startDate ? new Date(startDate + 'T00:00:00') : new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  });

  const handleDateClick = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    if (!startDate || (startDate && endDate)) {
      setFilter('startDate', dayStr);
      setFilter('endDate', null);
    } else {
      const start = new Date(startDate + 'T00:00:00');
      if (day < start) {
        setFilter('startDate', dayStr); 
      } else {
        setFilter('endDate', dayStr); 
        onClose(); 
      }
    }
  };

  const setPreset = (start: Date, end: Date) => {
    setFilter('startDate', format(start, 'yyyy-MM-dd'));
    setFilter('endDate', format(end, 'yyyy-MM-dd'));
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5, scale: 0.98 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, y: 5, scale: 0.98 }} 
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 mt-1.5 bg-card border border-border shadow-2xl rounded-[8px] overflow-hidden z-50 flex"
    >
      {/* PANEL IZQUIERDO: Presets de Auditoría */}
      <div className="hidden sm:flex flex-col w-[140px] bg-surface-2 border-r border-border p-2 gap-1">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground p-2 mb-1">Rutas Rápidas</p>
        <PresetBtn label="Hoy" onClick={() => setPreset(new Date(), new Date())} />
        <PresetBtn label="Ayer" onClick={() => setPreset(subDays(new Date(), 1), subDays(new Date(), 1))} />
        <PresetBtn label="Últimos 7 Días" onClick={() => setPreset(subDays(new Date(), 6), new Date())} />
        <PresetBtn label="Este Mes" onClick={() => setPreset(startOfMonth(new Date()), endOfMonth(new Date()))} />
        <PresetBtn label="Mes Pasado" onClick={() => setPreset(startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1)))} />
      </div>

      {/* PANEL DERECHO: Grilla de Calendario */}
      <div className="p-4 w-[280px]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-surface-2 rounded-[4px] text-muted-foreground transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-surface-2 rounded-[4px] text-muted-foreground transition-colors"><ChevronRight size={16} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-center text-[9px] font-black text-muted-foreground">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, i) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isSelectedStart = startDate === dayStr;
            const isSelectedEnd = endDate === dayStr;
            const isWithinRange = startDate && endDate && day > new Date(startDate + 'T00:00:00') && day < new Date(endDate + 'T00:00:00');
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={i}
                onClick={() => handleDateClick(day)}
                disabled={!isCurrentMonth}
                className={cn(
                  "h-8 flex items-center justify-center text-[11px] font-mono transition-all relative",
                  !isCurrentMonth && "text-muted-foreground/30 cursor-not-allowed",
                  isCurrentMonth && "hover:bg-surface-2 text-foreground font-medium",
                  isToday && !isSelectedStart && !isSelectedEnd && "text-primary font-black underline underline-offset-2",
                  (isSelectedStart || isSelectedEnd) && "bg-primary text-white font-black rounded-[4px] z-10 shadow-sm",
                  isWithinRange && "bg-primary/10 text-primary",
                  isSelectedStart && endDate && "rounded-r-none",
                  isSelectedEnd && startDate && "rounded-l-none",
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Sub-componente helper interno para los botones de presets
function PresetBtn({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left px-3 py-2 rounded-[6px] hover:bg-card text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">
      {label}
    </button>
  );
}