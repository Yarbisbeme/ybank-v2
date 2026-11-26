import { describe, expect, it } from 'vitest';
import { computeSplitSummary, formatItemCount } from './split-row';

describe('formatItemCount', () => {
  it('formats singular and plural item counts without typos (U2)', () => {
    expect(formatItemCount(0)).toBe('0 ítems');
    expect(formatItemCount(1)).toBe('1 ítem');
    expect(formatItemCount(2)).toBe('2 ítems');
    expect(formatItemCount(-3)).toBe('0 ítems');
  });
});

describe('computeSplitSummary', () => {
  it('handles 0.1 + 0.2 = 0.3 accurately in cents', () => {
    expect(computeSplitSummary('0.30', ['0.10', '0.20'])).toEqual({
      totalTarget: 0.3,
      totalSplit: 0.3,
      remaining: 0,
      isBalanced: true,
    });
  });

  it('detects missing and excess amounts', () => {
    expect(computeSplitSummary(1000, ['400', '250.50'])).toEqual({
      totalTarget: 1000,
      totalSplit: 650.5,
      remaining: 349.5,
      isBalanced: false,
    });

    expect(computeSplitSummary(500, ['300', '250'])).toEqual({
      totalTarget: 500,
      totalSplit: 550,
      remaining: -50,
      isBalanced: false,
    });
  });

  it('requires a positive target to be balanced', () => {
    expect(computeSplitSummary(0, ['0'])).toEqual({
      totalTarget: 0,
      totalSplit: 0,
      remaining: 0,
      isBalanced: false,
    });
  });
});
