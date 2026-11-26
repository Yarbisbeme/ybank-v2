import { describe, expect, it } from 'vitest';
import { computeCreditHealth } from './health-meter';

describe('computeCreditHealth', () => {
  it('classifies optimal, elevated, and risk utilization bands', () => {
    expect(
      computeCreditHealth({ totalLimit: 100000, totalUsed: 25000 }),
    ).toMatchObject({
      utilizationPercent: 25,
      available: 75000,
      level: 'optimal',
      badgeLabel: 'Óptimo',
    });

    expect(
      computeCreditHealth({ totalLimit: 100000, totalUsed: 45000 }),
    ).toMatchObject({
      utilizationPercent: 45,
      level: 'elevated',
      badgeLabel: 'Elevado',
    });

    expect(
      computeCreditHealth({ totalLimit: 100000, totalUsed: 75000 }),
    ).toMatchObject({
      utilizationPercent: 75,
      level: 'risk',
      badgeLabel: 'Riesgo',
    });
  });

  it('highlights upcoming cutoff dates within 5 days when there is balance used', () => {
    const res = computeCreditHealth({
      totalLimit: 50000,
      totalUsed: 10000,
      nearestCutoffDays: 3,
    });
    expect(res.headline).toContain('3 días');
  });

  it('handles zero credit limit safely', () => {
    expect(computeCreditHealth({ totalLimit: 0, totalUsed: 0 })).toMatchObject({
      utilizationPercent: 0,
      clampedPercent: 0,
      available: 0,
      badgeLabel: 'Sin límite',
    });
  });
});
