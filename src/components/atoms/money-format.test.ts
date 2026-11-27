import { describe, expect, it } from 'vitest';
import { formatMoney } from './money-format';

describe('formatMoney', () => {
  it('formats DOP and USD with currency first and en-US separators', () => {
    expect(formatMoney(48250)).toBe('DOP 48,250.00');
    expect(formatMoney(1250.5, { currency: 'USD' })).toBe('USD 1,250.50');
  });

  it('uses real Unicode minus for negative values and plus when signed', () => {
    expect(formatMoney(-1450)).toBe('− DOP 1,450.00');
    expect(formatMoney(-1450, { currency: 'DOP', sign: 'auto' })).toBe('− DOP 1,450.00');
    expect(formatMoney(25000, { currency: 'DOP', sign: 'auto' })).toBe('+ DOP 25,000.00');
    expect(formatMoney(25000, { currency: 'USD', sign: 'positive' })).toBe('+ USD 25,000.00');
    expect(formatMoney(1450, { currency: 'DOP', sign: 'negative' })).toBe('− DOP 1,450.00');
  });

  it('normalizes zero and near-zero values without a negative sign', () => {
    expect(formatMoney(0, { sign: 'auto' })).toBe('DOP 0.00');
    expect(formatMoney(-0, { sign: 'auto' })).toBe('DOP 0.00');
    expect(formatMoney(-0.001, { sign: 'negative' })).toBe('DOP 0.00');
  });

  it('handles numeric strings and rejects invalid inputs', () => {
    expect(formatMoney('1234.5')).toBe('DOP 1,234.50');
    expect(formatMoney('')).toBe('');
    expect(formatMoney('   ')).toBe('');
    expect(formatMoney('abc')).toBe('');
    expect(formatMoney(Number.NaN)).toBe('');
  });
});
