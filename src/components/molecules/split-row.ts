export interface SplitSummary {
  totalTarget: number;
  totalSplit: number;
  remaining: number;
  isBalanced: boolean;
}

function toCents(value: number | string): number {
  const num =
    typeof value === 'string'
      ? value.trim() === ''
        ? 0
        : Number(value)
      : value;
  if (!Number.isFinite(num)) {
    return 0;
  }
  return Math.round(num * 100);
}

/** Formats an item count cleanly in Spanish (fixes U2 "ÍT_EMS" typo). */
export function formatItemCount(count: number): string {
  const normalized = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return normalized === 1 ? '1 ítem' : `${normalized} ítems`;
}

/** Computes split totals in integer cents to prevent floating-point drift. */
export function computeSplitSummary(
  target: number | string,
  itemAmounts: (number | string)[],
): SplitSummary {
  const targetCents = toCents(target);
  const splitCents = itemAmounts.reduce<number>(
    (sum, item) => sum + toCents(item),
    0,
  );
  const remainingCents = targetCents - splitCents;

  return {
    totalTarget: targetCents / 100,
    totalSplit: splitCents / 100,
    remaining: remainingCents / 100,
    isBalanced: targetCents > 0 && remainingCents === 0,
  };
}
