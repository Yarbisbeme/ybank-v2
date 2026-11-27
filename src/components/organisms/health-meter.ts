export type CreditHealthLevel = 'optimal' | 'elevated' | 'risk';

export interface CreditHealthInput {
  totalLimit: number;
  totalUsed: number;
  nearestCutoffDays?: number | null;
}

export interface CreditHealthResult {
  utilizationPercent: number;
  clampedPercent: number;
  available: number;
  level: CreditHealthLevel;
  badgeLabel: string;
  headline: string;
}

/** Computes credit utilization level and a clear Spanish insight sentence. */
export function computeCreditHealth({
  totalLimit,
  totalUsed,
  nearestCutoffDays,
}: CreditHealthInput): CreditHealthResult {
  const safeLimit = Number.isFinite(totalLimit) ? Math.max(0, totalLimit) : 0;
  const safeUsed = Number.isFinite(totalUsed) ? Math.max(0, totalUsed) : 0;
  const available = safeLimit - safeUsed;

  if (safeLimit <= 0) {
    return {
      utilizationPercent: 0,
      clampedPercent: 0,
      available: 0,
      level: 'optimal',
      badgeLabel: 'Sin límite',
      headline: 'Configura un límite de crédito para seguir tu uso mensual.',
    };
  }

  const utilizationPercent = Math.round((safeUsed / safeLimit) * 100);
  const clampedPercent = Math.max(0, Math.min(100, utilizationPercent));

  const level: CreditHealthLevel =
    utilizationPercent <= 30
      ? 'optimal'
      : utilizationPercent < 60
        ? 'elevated'
        : 'risk';

  const badgeLabel =
    level === 'optimal'
      ? 'Óptimo'
      : level === 'elevated'
        ? 'Elevado'
        : 'Riesgo';

  let headline: string;
  if (
    typeof nearestCutoffDays === 'number' &&
    nearestCutoffDays <= 5 &&
    safeUsed > 0
  ) {
    headline = `Tu corte es en ${nearestCutoffDays} ${nearestCutoffDays === 1 ? 'día' : 'días'}; conviene abonar antes de cerrar.`;
  } else if (level === 'risk') {
    headline =
      'Estás usando más del 60% de tu límite. Realiza un abono para bajar tu carga.';
  } else if (level === 'elevated') {
    headline =
      'Pasaste del 30% recomendado; modera los cargos nuevos antes del corte.';
  } else {
    headline =
      'Buen ritmo: mantienes tu uso por debajo del 30% de tus límites.';
  }

  return {
    utilizationPercent,
    clampedPercent,
    available,
    level,
    badgeLabel,
    headline,
  };
}
