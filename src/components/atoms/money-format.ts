export type CurrencyCode = 'DOP' | 'USD';
export type MoneySignMode = 'none' | 'auto' | 'positive' | 'negative';

export interface FormatMoneyOptions {
  currency?: CurrencyCode;
  sign?: MoneySignMode;
}

/**
 * Formats a monetary value using YBank 2.0 conventions: currency code first,
 * `en-US` separators, two decimals, and Unicode minus (`−`) for negatives.
 */
export function formatMoney(
  value: number | string,
  options: FormatMoneyOptions = {},
): string {
  const { currency = 'DOP', sign = 'none' } = options;

  const parsed =
    typeof value === 'string'
      ? value.trim() === ''
        ? Number.NaN
        : Number(value)
      : value;

  if (!Number.isFinite(parsed)) {
    return '';
  }

  // Normalize values that round to 0.00 so zero is never displayed as "- DOP 0.00".
  const isZero = Math.abs(parsed) < 0.005;
  const magnitude = isZero ? 0 : Math.abs(parsed);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(magnitude);

  if (isZero) {
    return `${currency} ${formatted}`;
  }

  if (sign === 'positive' || (sign === 'auto' && parsed > 0)) {
    return `+ ${currency} ${formatted}`;
  }

  if (sign === 'negative' || (sign === 'auto' && parsed < 0) || (sign === 'none' && parsed < 0)) {
    return `\u2212 ${currency} ${formatted}`;
  }

  return `${currency} ${formatted}`;
}
