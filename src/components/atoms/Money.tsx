import { cn } from '@/lib/utils';
import { formatMoney, type CurrencyCode, type MoneySignMode } from './money-format';

export type MoneySize = 'xl' | 'l' | 'card' | 'amount' | 'small';
export type MoneyTone = 'default' | 'income' | 'expense' | 'debit' | 'pending' | 'muted';

export interface MoneyProps {
  value: number | string;
  currency?: CurrencyCode;
  size?: MoneySize;
  tone?: MoneyTone;
  sign?: MoneySignMode;
  as?: 'span' | 'p' | 'div';
  className?: string;
}

const SIZE_CLASSES: Record<MoneySize, string> = {
  xl: 'money-xl',
  l: 'money-l',
  card: 'money-card',
  amount: 'amount',
  small: 'small tabular-nums',
};

// Normal expenses stay in ink; debit is reserved for errors, rejections, or overdrafts.
const TONE_CLASSES: Record<MoneyTone, string> = {
  default: 'text-ink',
  income: 'text-credit',
  expense: 'text-ink',
  debit: 'text-debit',
  pending: 'text-pending',
  muted: 'text-ink-2',
};

/** Displays formatted DOP/USD amounts with tabular numerals and strict color discipline. */
export function Money({
  value,
  currency = 'DOP',
  size = 'amount',
  tone = 'default',
  sign = 'none',
  as: Component = 'span',
  className,
}: MoneyProps) {
  const formatted = formatMoney(value, { currency, sign });

  return (
    <Component
      className={cn(
        'tabular-nums',
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        className,
      )}
    >
      {formatted}
    </Component>
  );
}
