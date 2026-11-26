'use client';

import { AlertTriangle, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Skeleton, type CurrencyCode } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { MoveRow } from './MoveRow';
import type { MoveRowData } from './move-row';

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
  className?: string;
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
  className,
}: TransactionTableProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-panel border border-line bg-surface p-4 flex flex-col gap-3',
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
          'rounded-panel border border-line bg-surface',
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

  if (transactions.length === 0) {
    return (
      <div
        className={cn(
          'rounded-panel border border-line bg-surface',
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
        'rounded-panel border border-line bg-surface overflow-hidden',
        className,
      )}
    >
      <div>
        {transactions.map((tx, index) => {
          const txId = tx.id ?? `${tx.date}-${index}`;
          const isSelected = Boolean(tx.id && selectedIds?.has(tx.id));

          return (
            <MoveRow
              key={txId}
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
