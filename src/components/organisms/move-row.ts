import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CurrencyCode, MoneySignMode } from '@/components/atoms/money-format';
import type { MoneyTone } from '@/components/atoms/Money';
import { formatItemCount } from '@/components/molecules/split-row';
import { parseLocalDate } from '@/components/molecules/date-picker';

export interface MoveSubItem {
  id?: string;
  name?: string;
  unit_price?: string | number;
  category?: { name?: string } | null;
}

export interface MoveRowData {
  id?: string;
  type: string;
  description: string;
  date: string;
  amount: number;
  target_amount?: number;
  account_id: string;
  transfer_to_account_id?: string | null;
  is_split_child?: boolean;
  category?: {
    id?: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  } | null;
  account?: {
    id?: string;
    name: string;
    currency?: CurrencyCode;
  } | null;
  transfer_to_account?: {
    id?: string;
    name: string;
    currency?: CurrencyCode;
  } | null;
  items?: MoveSubItem[];
}

export interface MovePresentation {
  displayType: 'income' | 'expense' | 'transfer';
  displayAmount: number;
  displayCurrency: CurrencyCode;
  sign: MoneySignMode;
  tone: MoneyTone;
  subtitle: string;
  formattedDate: string;
  itemCountLabel: string | null;
  items: MoveSubItem[];
}

/** Computes display amount, sign, tone, and local date for a transaction row. */
export function resolveMovePresentation(
  tx: MoveRowData,
  activeAccountId?: string | null,
): MovePresentation {
  const isSplitChild = Boolean(tx.is_split_child);
  const isTransfer = !isSplitChild && tx.type === 'transfer';
  const isReceiver =
    isTransfer &&
    Boolean(activeAccountId) &&
    tx.transfer_to_account_id === activeAccountId;

  const displayAmount = isSplitChild
    ? tx.amount
    : isReceiver
      ? (tx.target_amount ?? tx.amount)
      : tx.amount;

  const displayType: 'income' | 'expense' | 'transfer' = isSplitChild
    ? 'expense'
    : isTransfer
      ? isReceiver
        ? 'income'
        : activeAccountId && tx.account_id === activeAccountId
          ? 'expense'
          : 'transfer'
      : tx.type === 'income'
        ? 'income'
        : 'expense';

  const sign: MoneySignMode =
    displayType === 'income'
      ? 'positive'
      : displayType === 'expense'
        ? 'negative'
        : 'none';

  const tone: MoneyTone =
    displayType === 'income'
      ? 'income'
      : displayType === 'expense'
        ? 'expense'
        : 'muted';

  const displayCurrency: CurrencyCode =
    (isReceiver ? tx.transfer_to_account?.currency : tx.account?.currency) ??
    'DOP';

  const items = isReceiver || isSplitChild ? [] : (tx.items ?? []);
  const itemCountLabel =
    items.length > 0 ? formatItemCount(items.length) : null;

  const isoDatePart = tx.date.split('T')[0];
  const parsedDate = parseLocalDate(isoDatePart);
  const formattedDate = parsedDate
    ? format(parsedDate, 'd MMM', { locale: es })
    : isoDatePart;

  let subtitle = 'Movimiento';
  if (isReceiver) {
    subtitle = `Desde ${tx.account?.name || 'otra cuenta'}`;
  } else if (isTransfer && tx.transfer_to_account?.name) {
    subtitle = `Hacia ${tx.transfer_to_account.name}`;
  } else if (tx.category?.name) {
    subtitle = tx.category.name;
  } else if (items.length > 0) {
    subtitle = 'Desglosado';
  } else if (isTransfer) {
    subtitle = 'Traspaso';
  }

  return {
    displayType,
    displayAmount,
    displayCurrency,
    sign,
    tone,
    subtitle,
    formattedDate,
    itemCountLabel,
    items,
  };
}
