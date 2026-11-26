import { endOfMonth, startOfMonth, subDays, subMonths } from 'date-fns';

export interface CalendarPresets {
  today: string;
  yesterday: string;
  thisMonthStart: string;
  thisMonthEnd: string;
  lastMonthStart: string;
  lastMonthEnd: string;
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Parses a local YYYY-MM-DD calendar string without UTC offset drift
 * (RD local date convention from AGENTS.md).
 */
export function parseLocalDate(iso: string): Date | null {
  const match = ISO_DATE_RE.exec(iso.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Formats a local Date instance as YYYY-MM-DD. */
export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Computes single and range calendar presets anchored to the given local date. */
export function getCalendarPresets(today: Date): CalendarPresets {
  const normalizedToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const yesterday = subDays(normalizedToday, 1);
  const previousMonth = subMonths(normalizedToday, 1);

  return {
    today: formatLocalDate(normalizedToday),
    yesterday: formatLocalDate(yesterday),
    thisMonthStart: formatLocalDate(startOfMonth(normalizedToday)),
    thisMonthEnd: formatLocalDate(endOfMonth(normalizedToday)),
    lastMonthStart: formatLocalDate(startOfMonth(previousMonth)),
    lastMonthEnd: formatLocalDate(endOfMonth(previousMonth)),
  };
}
