'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/atoms';
import {
  formatLocalDate,
  getCalendarPresets,
  parseLocalDate,
} from './date-picker';

export interface DateRangeValue {
  startDate: string | null;
  endDate: string | null;
}

export interface DatePickerProps {
  mode?: 'single' | 'range';
  value?: string | null;
  onChange?: (date: string | null) => void;
  startDate?: string | null;
  endDate?: string | null;
  onRangeChange?: (range: DateRangeValue) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function formatDisplayDate(iso: string): string {
  const parsed = parseLocalDate(iso);
  if (!parsed) {
    return iso;
  }
  return format(parsed, 'd MMM yyyy', { locale: es });
}

/** Accessible flat local-date calendar picker for single dates or date ranges. */
export function DatePicker({
  mode = 'single',
  value = null,
  onChange,
  startDate = null,
  endDate = null,
  onRangeChange,
  placeholder = 'Elegir fecha',
  disabled = false,
  id,
  'aria-label': ariaLabel,
  className,
}: DatePickerProps) {
  const dialogId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const initial =
      mode === 'single'
        ? value
          ? parseLocalDate(value)
          : null
        : startDate
          ? parseLocalDate(startDate)
          : null;
    return initial ?? new Date();
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (disabled) {
      return;
    }
    if (!isOpen) {
      const anchor =
        mode === 'single'
          ? value
            ? parseLocalDate(value)
            : null
          : startDate
            ? parseLocalDate(startDate)
            : null;
      setViewMonth(anchor ?? new Date());
    }
    setIsOpen((prev) => !prev);
  };

  const today = new Date();
  const presets = getCalendarPresets(today);

  const isHoyActive =
    mode === 'single'
      ? value === presets.today
      : startDate === presets.today && endDate === presets.today;
  const isAyerActive =
    mode === 'single'
      ? value === presets.yesterday
      : startDate === presets.yesterday && endDate === presets.yesterday;
  const isEsteMesActive =
    mode === 'range' &&
    startDate === presets.thisMonthStart &&
    endDate === presets.thisMonthEnd;
  const isMesPasadoActive =
    mode === 'range' &&
    startDate === presets.lastMonthStart &&
    endDate === presets.lastMonthEnd;

  const applyPreset = (start: string | null, end: string | null) => {
    if (mode === 'range') {
      onRangeChange?.({ startDate: start, endDate: end });
    } else {
      onChange?.(start);
    }
    setIsOpen(false);
  };

  const handleDaySelect = (day: Date) => {
    const dayStr = formatLocalDate(day);
    if (mode === 'single') {
      onChange?.(dayStr);
      setIsOpen(false);
      return;
    }

    if (!startDate || (startDate && endDate)) {
      onRangeChange?.({ startDate: dayStr, endDate: null });
      return;
    }

    const startParsed = parseLocalDate(startDate);
    if (startParsed && day < startParsed) {
      onRangeChange?.({ startDate: dayStr, endDate: null });
    } else {
      onRangeChange?.({ startDate, endDate: dayStr });
      setIsOpen(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 }),
  });

  const startParsed = startDate ? parseLocalDate(startDate) : null;
  const endParsed = endDate ? parseLocalDate(endDate) : null;

  const displayLabel =
    mode === 'single'
      ? value
        ? formatDisplayDate(value)
        : placeholder
      : startDate && endDate
        ? `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
        : startDate
          ? `Desde ${formatDisplayDate(startDate)}`
          : placeholder;

  const hasValue = mode === 'single' ? Boolean(value) : Boolean(startDate);
  const monthTitle = format(viewMonth, 'MMMM yyyy', { locale: es });
  const capitalizedMonth =
    monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  return (
    <div ref={wrapperRef} className={cn('relative inline-block w-full', className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel ?? placeholder}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? dialogId : undefined}
        onClick={toggleOpen}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-control border border-line-strong bg-surface px-3 body transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
          hasValue ? 'text-ink' : 'text-ink-3',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-ink-2',
        )}
      >
        <span className="truncate tabular-nums">{displayLabel}</span>
        <Calendar size={16} strokeWidth={2} className="text-ink-2 shrink-0" />
      </button>

      {isOpen ? (
        <div
          id={dialogId}
          role="dialog"
          aria-label="Selector de fecha"
          className="absolute left-0 top-full mt-1.5 flex flex-col sm:flex-row rounded-panel border border-line-strong bg-surface-raised shadow-overlay z-dropdown overflow-hidden"
        >
          <div className="flex flex-row sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-line bg-surface-sunk p-2 sm:w-32 overflow-x-auto">
            <PresetButton
              label="Hoy"
              active={isHoyActive}
              onClick={() =>
                applyPreset(
                  isHoyActive ? null : presets.today,
                  isHoyActive ? null : presets.today,
                )
              }
            />
            <PresetButton
              label="Ayer"
              active={isAyerActive}
              onClick={() =>
                applyPreset(
                  isAyerActive ? null : presets.yesterday,
                  isAyerActive ? null : presets.yesterday,
                )
              }
            />
            {mode === 'range' ? (
              <>
                <PresetButton
                  label="Este mes"
                  active={isEsteMesActive}
                  onClick={() =>
                    applyPreset(
                      isEsteMesActive ? null : presets.thisMonthStart,
                      isEsteMesActive ? null : presets.thisMonthEnd,
                    )
                  }
                />
                <PresetButton
                  label="Mes pasado"
                  active={isMesPasadoActive}
                  onClick={() =>
                    applyPreset(
                      isMesPasadoActive ? null : presets.lastMonthStart,
                      isMesPasadoActive ? null : presets.lastMonthEnd,
                    )
                  }
                />
              </>
            ) : null}
          </div>

          <div className="p-3.5 w-72 bg-surface-raised">
            <div className="flex items-center justify-between mb-3">
              <IconButton
                size="sm"
                variant="ghost"
                aria-label="Mes anterior"
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </IconButton>
              <span className="title-s text-ink">{capitalizedMonth}</span>
              <IconButton
                size="sm"
                variant="ghost"
                aria-label="Mes siguiente"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight size={16} strokeWidth={2} />
              </IconButton>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="text-center label text-ink-2 py-1"
                >
                  {weekday}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {days.map((day) => {
                const dayStr = formatLocalDate(day);
                const inMonth = isSameMonth(day, viewMonth);
                const isToday = isSameDay(day, today);

                const isSelectedSingle = mode === 'single' && value === dayStr;
                const isSelectedStart = mode === 'range' && startDate === dayStr;
                const isSelectedEnd = mode === 'range' && endDate === dayStr;
                const isSelected =
                  isSelectedSingle || isSelectedStart || isSelectedEnd;
                const isWithinRange =
                  mode === 'range' &&
                  startParsed !== null &&
                  endParsed !== null &&
                  day > startParsed &&
                  day < endParsed;

                return (
                  <button
                    key={dayStr}
                    type="button"
                    disabled={!inMonth}
                    aria-label={format(day, 'd MMMM yyyy', { locale: es })}
                    aria-pressed={isSelected}
                    onClick={() => handleDaySelect(day)}
                    className={cn(
                      'h-8 flex items-center justify-center small tabular-nums transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-1',
                      !inMonth && 'text-ink-3 cursor-not-allowed',
                      inMonth &&
                        !isSelected &&
                        !isWithinRange &&
                        'rounded-control text-ink hover:bg-action-wash hover:text-action cursor-pointer',
                      isToday && !isSelected && 'underline underline-offset-2 text-action',
                      isWithinRange && 'bg-action-wash text-action rounded-none cursor-pointer',
                      isSelected && 'rounded-control bg-action text-action-ink cursor-pointer',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PresetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-2.5 py-1.5 rounded-control small text-left whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
        active
          ? 'bg-action text-action-ink'
          : 'text-ink-2 hover:bg-surface hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}
