'use client';

import { ArrowRight, ArrowRightLeft, Pencil, Receipt } from 'lucide-react';
import type { Account, TransactionFormData } from '@/types';
import { getCategoryIcon } from '@/lib/utils';
import { Button, CategoryChip, Money } from '@/components/atoms';
import { EmptyState, formatItemCount } from '@/components/molecules';

export interface TransactionDetailViewProps {
  transaction: TransactionFormData;
  accounts: Account[];
  onEditRequest: () => void;
}

/** Read-only breakdown view for transfers and itemized receipt transactions. */
export default function TransactionDetailView({
  transaction,
  accounts,
  onEditRequest,
}: TransactionDetailViewProps) {
  const items = transaction.items ?? [];
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const originAccount = accounts.find((acc) => acc.id === transaction.account_id);
  const originAccountName =
    originAccount?.name ?? transaction.account?.name ?? 'Cuenta desconocida';

  const destAccountId = transaction.transfer_to_account_id;
  const destAccountName = destAccountId
    ? (accounts.find((acc) => acc.id === destAccountId)?.name ??
      transaction.transfer_to_account?.name ??
      'Cuenta destino')
    : null;

  const currency = originAccount?.currency ?? transaction.account?.currency ?? 'DOP';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-3 pt-2">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-tile bg-surface-sunk text-ink-2"
        >
          {isTransfer ? (
            <ArrowRightLeft size={20} strokeWidth={2} />
          ) : (
            getCategoryIcon(transaction.category?.icon)
          )}
        </span>

        <div className="flex flex-col gap-1">
          <h3 className="title text-ink">
            {transaction.description || 'Movimiento sin descripción'}
          </h3>
          <Money
            value={transaction.amount}
            currency={currency}
            size="l"
            tone={isIncome ? 'income' : isExpense ? 'expense' : 'muted'}
            sign={isIncome ? 'positive' : isExpense ? 'negative' : 'none'}
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Pencil size={14} strokeWidth={2} />}
          onClick={onEditRequest}
        >
          {isTransfer ? 'Editar traspaso' : 'Editar movimiento'}
        </Button>
      </div>

      <div className="border-y border-line py-4">
        {isTransfer ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="label text-ink-2">Origen</span>
              <span className="body-strong text-ink truncate">
                {originAccountName}
              </span>
            </div>

            <ArrowRight size={16} strokeWidth={2} className="text-ink-2 shrink-0" />

            <div className="flex flex-col gap-0.5 min-w-0 text-right">
              <span className="label text-ink-2">Destino</span>
              <span className="body-strong text-ink truncate">
                {destAccountName}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="label text-ink-2">Cuenta</span>
              <span className="body-strong text-ink truncate">
                {originAccountName}
              </span>
            </div>

            <div className="flex flex-col items-start gap-1 min-w-0">
              <span className="label text-ink-2">Categoría</span>
              <CategoryChip
                label={transaction.category?.name || 'Múltiples categorías'}
                icon={getCategoryIcon(transaction.category?.icon)}
              />
            </div>
          </div>
        )}
      </div>

      <section aria-label="Desglose de ítems" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="title-s text-ink">Desglose</h4>
          <span className="rounded-chip bg-surface-sunk px-2 py-0.5 label text-ink-2 tabular-nums">
            {formatItemCount(items.length)}
          </span>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<Receipt size={20} strokeWidth={2} />}
            title="Sin ítems registrados"
            description="Este movimiento no tiene desglose por recibo."
          />
        ) : (
          <div className="rounded-panel border border-line bg-surface divide-y divide-line">
            {items.map((item, idx) => (
              <div
                key={item.id ?? `${idx}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="body-strong text-ink truncate">
                    {item.name || 'Ítem'}
                  </p>
                  <p className="small text-ink-2 truncate">
                    {item.category?.name || 'Sin categoría'}
                  </p>
                </div>

                <Money
                  value={item.unit_price ?? 0}
                  currency={currency}
                  size="small"
                  className="shrink-0"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
