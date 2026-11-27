import { describe, expect, it } from 'vitest';
import { sanitizeAmountInput } from './amount-input';

describe('sanitizeAmountInput', () => {
  it('keeps valid decimal numbers up to two fractional digits', () => {
    expect(sanitizeAmountInput('1250.45')).toBe('1250.45');
    expect(sanitizeAmountInput('1250.459')).toBe('1250.45');
    expect(sanitizeAmountInput('500')).toBe('500');
  });

  it('handles leading dot and multiple dots cleanly', () => {
    expect(sanitizeAmountInput('.5')).toBe('0.5');
    expect(sanitizeAmountInput('.')).toBe('0.');
    expect(sanitizeAmountInput('12.3.45')).toBe('12.34');
  });

  it('strips non-numeric characters and returns empty string when nothing remains', () => {
    expect(sanitizeAmountInput('DOP 1,234.56')).toBe('1234.56');
    expect(sanitizeAmountInput('-450.25abc')).toBe('450.25');
    expect(sanitizeAmountInput('abc')).toBe('');
  });
});
