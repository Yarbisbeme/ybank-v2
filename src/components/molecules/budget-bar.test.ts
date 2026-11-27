import { describe, expect, it } from 'vitest';
import { computeBudgetProgress } from './budget-bar';

describe('computeBudgetProgress', () => {
  it('classifies budget thresholds (<80%, 80-99%, >=100%)', () => {
    expect(computeBudgetProgress(400, 1000, 'budget')).toEqual({
      percent: 40,
      clampedPercent: 40,
      status: 'normal',
    });

    expect(computeBudgetProgress(800, 1000, 'budget')).toEqual({
      percent: 80,
      clampedPercent: 80,
      status: 'warning',
    });

    expect(computeBudgetProgress(1250, 1000, 'budget')).toEqual({
      percent: 125,
      clampedPercent: 100,
      status: 'exceeded',
    });
  });

  it('classifies savings goal achievement at >=100%', () => {
    expect(computeBudgetProgress(950, 1000, 'goal')).toEqual({
      percent: 95,
      clampedPercent: 95,
      status: 'normal',
    });

    expect(computeBudgetProgress(1000, 1000, 'goal')).toEqual({
      percent: 100,
      clampedPercent: 100,
      status: 'achieved',
    });
  });

  it('guards against non-positive or invalid targets', () => {
    expect(computeBudgetProgress(500, 0, 'budget')).toEqual({
      percent: 0,
      clampedPercent: 0,
      status: 'normal',
    });

    expect(computeBudgetProgress(-50, 1000, 'goal')).toEqual({
      percent: 0,
      clampedPercent: 0,
      status: 'normal',
    });
  });
});
