/**
 * Decides how a list of movements animates when it re-renders. The rule: a list
 * only moves when its content changes because of something the user did, never
 * because it was shown (arriving at a screen, first load, background refresh).
 */

/** Delay between consecutive rows when a new query's rows enter. */
export const LIST_STAGGER_STEP_MS = 20;
/** Rows past this one enter together with it, so long lists stay quick. */
export const LIST_STAGGER_CAP = 8;

/** The rows on screen and the query they answer. */
export interface ListSnapshot {
  /** Identifies the query (filters + page). A different key means "new results". */
  key: string;
  ids: string[];
  /** False while the list is loading (skeleton): nothing to compare against yet. */
  ready: boolean;
}

export type RowMotion =
  | { kind: 'enter'; delayMs: number }
  | { kind: 'highlight' };

export interface ListMotionPlan {
  rows: Map<string, RowMotion>;
  /** Rows that left the list, to keep collapsing at their previous position. */
  exiting: { id: string; index: number }[];
}

const OPTIMISTIC_PREFIX = 'temp-id-';
const isOptimistic = (id: string) => id.startsWith(OPTIMISTIC_PREFIX);

const noMotion = (): ListMotionPlan => ({ rows: new Map(), exiting: [] });

export function planListMotion(
  prev: ListSnapshot | null,
  next: ListSnapshot,
): ListMotionPlan {
  if (!prev || !prev.ready || !next.ready) {
    return noMotion();
  }

  if (prev.key !== next.key) {
    const rows = new Map<string, RowMotion>();
    next.ids.forEach((id, index) => {
      const step = Math.min(index, LIST_STAGGER_CAP - 1);
      rows.set(id, { kind: 'enter', delayMs: step * LIST_STAGGER_STEP_MS });
    });
    return { rows, exiting: [] };
  }

  const prevSet = new Set(prev.ids);
  const nextSet = new Set(next.ids);
  let added = next.ids.filter((id) => !prevSet.has(id));
  const removed = prev.ids
    .map((id, index) => ({ id, index }))
    .filter(({ id }) => !nextSet.has(id));

  // The server answering an optimistic insert swaps the temporary id for the
  // real one: the same row, already highlighted when it appeared.
  const replacedOptimistic = removed.filter(({ id }) => isOptimistic(id));
  added = added.slice(replacedOptimistic.length);
  const exiting = removed.filter(({ id }) => !isOptimistic(id));

  const rows = new Map<string, RowMotion>();
  for (const id of added) {
    rows.set(id, { kind: 'highlight' });
  }
  return { rows, exiting };
}
