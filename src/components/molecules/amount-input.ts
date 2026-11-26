/**
 * Sanitizes raw decimal input for monetary fields: keeps digits and at most
 * one decimal point with up to two fractional digits.
 */
export function sanitizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) {
    return '';
  }

  const dotIndex = cleaned.indexOf('.');
  if (dotIndex === -1) {
    return cleaned;
  }

  const integerPart = cleaned.slice(0, dotIndex) || '0';
  const fractionalPart = cleaned
    .slice(dotIndex + 1)
    .replace(/\./g, '')
    .slice(0, 2);

  return `${integerPart}.${fractionalPart}`;
}
