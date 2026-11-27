export interface CardStackFrame {
  x: number;
  scale: number;
  rot: number;
  zIndex: number;
  opacity: number;
  dim: number;
}

/** Computes the target geometric slot for a card offset relative to center. */
export function calculateCardSlot(delta: number, width: number): CardStackFrame {
  const absDelta = Math.abs(delta);
  const sign = delta < 0 ? -1 : 1;
  const x =
    absDelta === 0
      ? 0
      : sign * (absDelta === 1 ? 0.34 : absDelta === 2 ? 0.56 : 0.66) * width;
  const scale =
    absDelta === 0 ? 1 : absDelta === 1 ? 0.84 : absDelta === 2 ? 0.7 : 0.6;
  const rot = absDelta === 0 ? 0 : sign * (absDelta === 1 ? 4 : 7);

  return {
    x,
    scale,
    rot,
    zIndex: 20 - absDelta,
    opacity: absDelta > 2 ? 0 : 1,
    dim: absDelta === 0 ? 0 : absDelta === 1 ? 0.28 : 0.45,
  };
}

/** Normalizes pointer drag distance and applies 0.25x rubber-band damping past deck bounds. */
export function computeLiveDragOffset(
  deltaX: number,
  cardWidth: number,
  activeIndex: number,
  totalCount: number,
): number {
  if (deltaX === 0 || cardWidth <= 0) {
    return 0;
  }
  const rawOffset = deltaX / (cardWidth * 0.9);
  const pastStart = activeIndex === 0 && deltaX > 0;
  const pastEnd = activeIndex >= totalCount - 1 && deltaX < 0;
  return pastStart || pastEnd ? rawOffset * 0.25 : rawOffset;
}

/** Computes interpolated position, scale, rotation, opacity, and shade for a card during rest or drag. */
export function computeCardFrame(
  cardIndex: number,
  activeIndex: number,
  liveOffset: number,
  cardWidth: number,
): CardStackFrame {
  // Positive liveOffset keeps cards tracking the pointer direction continuously (left drag -> negative x).
  const delta = cardIndex - activeIndex + liveOffset;
  const roundedDelta = Math.round(delta);
  const slot1 = calculateCardSlot(roundedDelta, cardWidth);
  const nextStep = roundedDelta + (delta > roundedDelta ? 1 : -1);
  const slot2 = calculateCardSlot(nextStep, cardWidth);
  const fraction = Math.abs(delta - roundedDelta);

  return {
    x: slot1.x + (slot2.x - slot1.x) * fraction,
    scale: slot1.scale + (slot2.scale - slot1.scale) * fraction,
    rot: slot1.rot + (slot2.rot - slot1.rot) * fraction,
    zIndex: slot1.zIndex,
    opacity: slot1.opacity + (slot2.opacity - slot1.opacity) * fraction,
    dim: slot1.dim + (slot2.dim - slot1.dim) * fraction,
  };
}
