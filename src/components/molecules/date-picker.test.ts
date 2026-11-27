import { describe, expect, it } from 'vitest';
import {
  formatLocalDate,
  getCalendarPresets,
  parseLocalDate,
} from './date-picker';

describe('parseLocalDate and formatLocalDate', () => {
  it('roundtrips valid YYYY-MM-DD dates without timezone drift', () => {
    const parsed = parseLocalDate('2026-11-25');
    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(2026);
    expect(parsed!.getMonth()).toBe(10);
    expect(parsed!.getDate()).toBe(25);
    expect(formatLocalDate(parsed!)).toBe('2026-11-25');
  });

  it('rejects malformed or impossible calendar dates', () => {
    expect(parseLocalDate('2026-02-30')).toBeNull();
    expect(parseLocalDate('2026-13-01')).toBeNull();
    expect(parseLocalDate('25-11-2026')).toBeNull();
    expect(parseLocalDate('')).toBeNull();
  });
});

describe('getCalendarPresets', () => {
  it('computes today, yesterday, this month, and last month presets', () => {
    const presets = getCalendarPresets(new Date(2026, 2, 1)); // 2026-03-01
    expect(presets).toEqual({
      today: '2026-03-01',
      yesterday: '2026-02-28',
      thisMonthStart: '2026-03-01',
      thisMonthEnd: '2026-03-31',
      lastMonthStart: '2026-02-01',
      lastMonthEnd: '2026-02-28',
    });
  });
});
