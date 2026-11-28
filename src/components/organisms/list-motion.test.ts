import { describe, expect, it } from 'vitest';
import {
  LIST_STAGGER_CAP,
  LIST_STAGGER_STEP_MS,
  planListMotion,
  type ListSnapshot,
} from './list-motion';

const snap = (key: string, ids: string[], ready = true): ListSnapshot => ({
  key,
  ids,
  ready,
});

describe('planListMotion', () => {
  it('arriving at a screen animates nothing', () => {
    const plan = planListMotion(null, snap('all|1', ['a', 'b']));
    expect(plan.rows.size).toBe(0);
    expect(plan.exiting).toEqual([]);
  });

  it('the first load after the skeleton animates nothing', () => {
    const plan = planListMotion(snap('all|1', [], false), snap('all|1', ['a', 'b']));
    expect(plan.rows.size).toBe(0);
  });

  it('a new query (filter, search, page) staggers its rows top to bottom', () => {
    const plan = planListMotion(snap('all|1', ['a', 'b']), snap('expense|1', ['b', 'c', 'd']));
    expect(plan.rows.get('b')).toEqual({ kind: 'enter', delayMs: 0 });
    expect(plan.rows.get('c')).toEqual({ kind: 'enter', delayMs: LIST_STAGGER_STEP_MS });
    expect(plan.rows.get('d')).toEqual({ kind: 'enter', delayMs: 2 * LIST_STAGGER_STEP_MS });
    expect(plan.exiting).toEqual([]);
  });

  it('caps the stagger so long lists never take longer than the eighth row', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `r${i}`);
    const plan = planListMotion(snap('all|1', ['x']), snap('all|2', ids));
    const lastDelay = (LIST_STAGGER_CAP - 1) * LIST_STAGGER_STEP_MS;
    expect(plan.rows.get('r7')).toEqual({ kind: 'enter', delayMs: lastDelay });
    expect(plan.rows.get('r19')).toEqual({ kind: 'enter', delayMs: lastDelay });
  });

  it('a new movement in the same list highlights only that row', () => {
    const plan = planListMotion(snap('all|1', ['a', 'b']), snap('all|1', ['n', 'a', 'b']));
    expect([...plan.rows.entries()]).toEqual([['n', { kind: 'highlight' }]]);
  });

  it('a deleted movement collapses at its previous position', () => {
    const plan = planListMotion(snap('all|1', ['a', 'b', 'c']), snap('all|1', ['a', 'c']));
    expect(plan.rows.size).toBe(0);
    expect(plan.exiting).toEqual([{ id: 'b', index: 1 }]);
  });

  it('a background refresh with the same rows animates nothing', () => {
    const plan = planListMotion(snap('all|1', ['a', 'b']), snap('all|1', ['a', 'b']));
    expect(plan.rows.size).toBe(0);
    expect(plan.exiting).toEqual([]);
  });

  it('the server replacing an optimistic row is the same row: no second highlight, no collapse', () => {
    const plan = planListMotion(
      snap('all|1', ['temp-id-123', 'a']),
      snap('all|1', ['real-1', 'a']),
    );
    expect(plan.rows.size).toBe(0);
    expect(plan.exiting).toEqual([]);
  });

  it('while the next query is loading the shown list does not change its plan', () => {
    // Same key: the table keeps showing the previous query's rows (dimmed).
    const prev = snap('all|1', ['a', 'b']);
    const plan = planListMotion(prev, snap('all|1', ['a', 'b']));
    expect(plan.rows.size).toBe(0);
  });
});
