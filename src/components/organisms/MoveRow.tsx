'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn, getCategoryIcon } from '@/lib/utils';
import { IconButton, Money, type CurrencyCode } from '@/components/atoms';
import { resolveMovePresentation, type MoveRowData } from './move-row';

export interface MoveRowProps {
  transaction: MoveRowData;
  activeAccountId?: string | null;
  currency?: CurrencyCode;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onSelect?: () => void;
  className?: string;
}

/** Accessible transaction row with tabular money formatting and expandable receipt split. */
export function MoveRow({
  transaction,
  activeAccountId,
  currency,
  selectable = false,
  selected = false,
  onToggleSelect,
  onSelect,
  className,
}: MoveRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const presentation = resolveMovePresentation(transaction, activeAccountId);
  const rowCurrency = currency ?? presentation.displayCurrency;
  const hasSplitItems = presentation.items.length > 0;

  return (
    <div
      className={cn(
        'border-b border-line last:border-b-0 transition-colors duration-150',
        selected && 'bg-action-wash',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-3 sm:px-4 py-3">
        {selectable && onToggleSelect ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Seleccionar ${transaction.description || 'movimiento'}`}
            onClick={onToggleSelect}
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-chip border transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
              selected
                ? 'border-action bg-action text-action-ink'
                : 'border-line-strong bg-surface hover:border-action',
            )}
          >
            {selected ? <Check size={12} strokeWidth={2.5} /> : null}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onSelect}
          disabled={!onSelect}
          className={cn(
            'flex flex-1 min-w-0 items-center justify-between gap-3 rounded-control py-0.5 text-left focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
            onSelect ? 'cursor-pointer hover:opacity-90' : 'cursor-default',
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-tile bg-surface-sunk text-ink-2"
            >
              {getCategoryIcon(transaction.category?.icon)}
            </span>

            <div className="min-w-0">
              <p className="body-strong text-ink truncate">
                {transaction.description || 'Movimiento'}
              </p>
              <p className="small text-ink-2 truncate">
                {presentation.subtitle} · {presentation.formattedDate}
                {presentation.itemCountLabel
                  ? ` · ${presentation.itemCountLabel}`
                  : ''}
              </p>
            </div>
          </div>

          <Money
            value={presentation.displayAmount}
            currency={rowCurrency}
            size="amount"
            tone={presentation.tone}
            sign={presentation.sign}
            className="shrink-0"
          />
        </button>

        {hasSplitItems ? (
          <IconButton
            size="sm"
            variant="ghost"
            aria-label={isExpanded ? 'Ocultar desglose' : 'Ver desglose'}
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={cn(
                'transition-transform duration-150',
                isExpanded && 'rotate-180',
              )}
            />
          </IconButton>
        ) : null}
      </div>

      {isExpanded && hasSplitItems ? (
        <div className="ml-12 mr-4 mb-3 border-l border-line pl-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="label text-ink-2">
              Desglose ({presentation.itemCountLabel})
            </span>
            {onSelect ? (
              <button
                type="button"
                onClick={onSelect}
                className="label text-action hover:underline cursor-pointer"
              >
                Editar
              </button>
            ) : null}
          </div>

          {presentation.items.map((item, idx) => (
            <div
              key={item.id ?? `${idx}`}
              className="flex items-baseline justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="small text-ink truncate">{item.name || 'Ítem'}</p>
                {item.category?.name ? (
                  <p className="nav text-ink-2 truncate">{item.category.name}</p>
                ) : null}
              </div>
              <Money
                value={item.unit_price ?? 0}
                currency={rowCurrency}
                size="small"
                tone="muted"
                className="shrink-0"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
