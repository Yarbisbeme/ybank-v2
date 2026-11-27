import { describe, expect, it } from 'vitest';
import { computeCardFrame, computeLiveDragOffset } from './card-stack';

describe('computeCardFrame', () => {
  const width = 290;

  it('places active card centered and neighbors tucked symmetrically at rest', () => {
    const prev = computeCardFrame(0, 1, 0, width);
    const active = computeCardFrame(1, 1, 0, width);
    const next = computeCardFrame(2, 1, 0, width);

    expect(active).toEqual({
      x: 0,
      scale: 1,
      rot: 0,
      zIndex: 20,
      opacity: 1,
      dim: 0,
    });
    expect(prev.x).toBeLessThan(0);
    expect(prev.scale).toBeCloseTo(0.84);
    expect(prev.rot).toBe(-4);
    expect(prev.dim).toBeCloseTo(0.28);

    expect(next.x).toBeGreaterThan(0);
    expect(next.scale).toBeCloseTo(0.84);
    expect(next.rot).toBe(4);
    expect(next.dim).toBeCloseTo(0.28);
  });

  it('moves cards LEFT and pulls next card forward when swiping left (deltaX < 0)', () => {
    const restNext = computeCardFrame(1, 0, 0, width);
    const liveOffset = computeLiveDragOffset(-100, width, 0, 3);
    expect(liveOffset).toBeLessThan(0);

    const activeDragging = computeCardFrame(0, 0, liveOffset, width);
    const nextDragging = computeCardFrame(1, 0, liveOffset, width);

    expect(activeDragging.x).toBeLessThan(0);
    expect(nextDragging.x).toBeLessThan(restNext.x);
    expect(nextDragging.scale).toBeGreaterThan(restNext.scale);
    expect(nextDragging.dim).toBeLessThan(restNext.dim);
  });

  it('moves cards RIGHT and pulls previous card forward when swiping right (deltaX > 0)', () => {
    const restPrev = computeCardFrame(0, 1, 0, width);
    const liveOffset = computeLiveDragOffset(100, width, 1, 3);
    expect(liveOffset).toBeGreaterThan(0);

    const activeDragging = computeCardFrame(1, 1, liveOffset, width);
    const prevDragging = computeCardFrame(0, 1, liveOffset, width);

    expect(activeDragging.x).toBeGreaterThan(0);
    expect(prevDragging.x).toBeGreaterThan(restPrev.x);
    expect(prevDragging.scale).toBeGreaterThan(restPrev.scale);
    expect(prevDragging.dim).toBeLessThan(restPrev.dim);
  });
});

describe('computeLiveDragOffset', () => {
  it('applies 0.25x rubber-band damping past deck start and end', () => {
    const freeLeft = computeLiveDragOffset(-90, 290, 0, 3);
    const dampedLeft = computeLiveDragOffset(-90, 290, 2, 3);
    expect(dampedLeft).toBeCloseTo(freeLeft * 0.25);

    const freeRight = computeLiveDragOffset(90, 290, 2, 3);
    const dampedRight = computeLiveDragOffset(90, 290, 0, 3);
    expect(dampedRight).toBeCloseTo(freeRight * 0.25);
  });
});
