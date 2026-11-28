'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button, Skeleton, type CurrencyCode } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { MoveRow } from './MoveRow';
import type { MoveRowData } from './move-row';
import {
  planListMotion,
  type ListMotionPlan,
  type ListSnapshot,
} from './list-motion';

const rowId = (tx: MoveRowData, index: number) =>
  tx.id ?? `${tx.date}-${index}`;

const sameSnapshot = (a: ListSnapshot, b: ListSnapshot) =>
  a.key === b.key && a.ready === b.ready && a.ids.join('|') === b.ids.join('|');

interface ExitingRow {
  id: string;
  index: number;
  tx: MoveRowData;
}

interface ListMotionState {
  snapshot: ListSnapshot;
  rows: MoveRowData[];
  plan: ListMotionPlan;
  exiting: ExitingRow[];
}

export interface TransactionTableProps {
  transactions: MoveRowData[];
  activeAccountId?: string | null;
  currency?: CurrencyCode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectTransaction?: (tx: MoveRowData) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (tx: MoveRowData) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  bare?: boolean;
  className?: string;
  /**
   * Identifies the query the shown rows answer (filters + page). A new key means
   * new results and staggers them in; omit it and the list never animates.
   */
  listKey?: string;
  /** The rows are the previous query's while the next one loads: dim them. */
  isStale?: boolean;
}

/** Flat list of MoveRow items with explicit loading, error, empty, and pagination states. */
export function TransactionTable({
  transactions,
  activeAccountId,
  currency,
  isLoading = false,
  error = null,
  onRetry,
  onSelectTransaction,
  selectable = false,
  selectedIds,
  onToggleSelect,
  emptyTitle = 'No hay movimientos',
  emptyDescription = 'Cuando registres un ingreso, gasto o traspaso aparecerá aquí.',
  emptyAction,
  page = 1,
  totalPages = 1,
  totalCount,
  onPageChange,
  bare = false,
  className,
  listKey,
  isStale = false,
}: TransactionTableProps) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const snapshot: ListSnapshot = {
    key: listKey ?? '',
    ids: transactions.map(rowId),
    ready: !isLoading && !error && listKey !== undefined,
  };
  const [motion, setMotion] = useState<ListMotionState>(() => ({
    snapshot,
    rows: transactions,
    plan: planListMotion(null, snapshot),
    exiting: [],
  }));

  // Adjusting state during render (not in an effect) so a changed list paints
  // its first frame already with its animation classes.
  if (!sameSnapshot(motion.snapshot, snapshot)) {
    const plan = planListMotion(motion.snapshot, snapshot);
    const prevById = new Map(motion.rows.map((tx, i) => [rowId(tx, i), tx]));
    const leaving = reduceMotion
      ? []
      : plan.exiting.flatMap(({ id, index }) => {
          const tx = prevById.get(id);
          return tx ? [{ id, index, tx }] : [];
        });
    setMotion({
      snapshot,
      rows: transactions,
      plan,
      exiting: [...motion.exiting.filter((e) => !snapshot.ids.includes(e.id)), ...leaving],
    });
  }

  const finishExit = (id: string) =>
    setMotion((m) => ({ ...m, exiting: m.exiting.filter((e) => e.id !== id) }));

  if (isLoading) {
    return (
      <div
        className={cn(
          bare
            ? 'flex flex-col gap-3 py-2'
            : 'rounded-panel border border-line bg-surface p-4 flex flex-col gap-3',
          className,
        )}
      >
        <Skeleton variant="tile" label="Cargando movimientos" />
        <Skeleton variant="tile" />
        <Skeleton variant="tile" />
        <Skeleton variant="tile" />
        <Skeleton variant="tile" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          bare ? 'py-2' : 'rounded-panel border border-line bg-surface',
          className,
        )}
      >
        <EmptyState
          tone="error"
          icon={<AlertTriangle size={24} strokeWidth={2} />}
          title="No pudimos cargar los movimientos"
          description={error}
          action={
            onRetry ? (
              <Button variant="secondary" onClick={onRetry}>
                Reintentar
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  // Current rows, plus deleted ones kept at their previous position while they fold.
  type DisplayRow =
    | { exiting: false; id: string; tx: MoveRowData }
    | { exiting: true; id: string; tx: MoveRowData };
  const displayRows: DisplayRow[] = transactions.map((tx, index) => ({
    exiting: false,
    id: rowId(tx, index),
    tx,
  }));
  for (const leaving of [...motion.exiting].sort((a, b) => a.index - b.index)) {
    const at = Math.min(leaving.index, displayRows.length);
    displayRows.splice(at, 0, { exiting: true, id: leaving.id, tx: leaving.tx });
  }

  if (transactions.length === 0) {
    return (
      <div
        className={cn(
          bare ? 'py-2' : 'rounded-panel border border-line bg-surface',
          className,
        )}
      >
        <EmptyState
          icon={<Receipt size={24} strokeWidth={2} />}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        bare
          ? 'border-t border-line'
          : 'rounded-panel border border-line bg-surface overflow-hidden',
        className,
      )}
    >
      <div className={cn(isStale && 'y2-list-stale')} aria-busy={isStale}>
        {displayRows.map((row) => {
          if (row.exiting) {
            return (
              <div
                key={`exit-${row.id}`}
                className="y2-row-collapse"
                aria-hidden
                onAnimationEnd={(event) => {
                  if (event.animationName === 'y2-row-collapse') {
                    finishExit(row.id);
                  }
                }}
              >
                <div>
                  <MoveRow
                    transaction={row.tx}
                    activeAccountId={activeAccountId}
                    currency={currency}
                  />
                </div>
              </div>
            );
          }

          const { tx, id } = row;
          const isSelected = Boolean(tx.id && selectedIds?.has(tx.id));
          const rowMotion = motion.plan.rows.get(id);

          return (
            <div
              key={id}
              className={cn(
                rowMotion?.kind === 'enter' && 'y2-row-enter',
                rowMotion?.kind === 'highlight' && 'y2-row-highlight',
              )}
              style={
                rowMotion?.kind === 'enter'
                  ? { animationDelay: `${rowMotion.delayMs}ms` }
                  : undefined
              }
            >
              <MoveRow
                transaction={tx}
                activeAccountId={activeAccountId}
                currency={currency}
                selectable={selectable}
                selected={isSelected}
                onToggleSelect={
                  onToggleSelect ? () => onToggleSelect(tx) : undefined
                }
                onSelect={
                  onSelectTransaction ? () => onSelectTransaction(tx) : undefined
                }
              />
            </div>
          );
        })}
      </div>

      {onPageChange && totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <span className="small text-ink-2 tabular-nums">
            Página {page} de {totalPages}
            {typeof totalCount === 'number' ? ` · ${totalCount} en total` : ''}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              leftIcon={<ChevronLeft size={14} strokeWidth={2} />}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              rightIcon={<ChevronRight size={14} strokeWidth={2} />}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
