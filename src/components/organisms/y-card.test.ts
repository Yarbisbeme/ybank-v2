import { describe, expect, it } from 'vitest';
import {
  CARD_PALETTE,
  getAccountTypeLabel,
  getCardLuminance,
  getCardTextTone,
  hexToWash,
  mapDbPatternToCardShape,
  resolveCardHex,
} from './y-card';

describe('YCard contrast and color helpers', () => {
  it('switches text tone to dark when luminance exceeds 150', () => {
    expect(getCardLuminance(CARD_PALETTE.hueso)).toBeGreaterThan(150);
    expect(getCardTextTone(CARD_PALETTE.hueso)).toBe('dark');
    expect(getCardTextTone(CARD_PALETTE.lima)).toBe('dark');

    expect(getCardLuminance(CARD_PALETTE.ultramar)).toBeLessThanOrEqual(150);
    expect(getCardTextTone(CARD_PALETTE.ultramar)).toBe('light');
    expect(getCardTextTone(CARD_PALETTE.tinta)).toBe('light');
  });

  it('resolves palette keys and computes 12% section washes', () => {
    expect(resolveCardHex('coral')).toBe(CARD_PALETTE.coral);
    expect(resolveCardHex('#abc')).toBe('#aabbcc');
    expect(resolveCardHex('invalid')).toBe(CARD_PALETTE.ultramar);
    expect(hexToWash('#1f4bff')).toBe('rgba(31, 75, 255, 0.12)');
  });

  it('labels savings accounts cleanly as Ahorro (U1) and maps DB patterns', () => {
    expect(getAccountTypeLabel('savings')).toBe('Ahorro');
    expect(getAccountTypeLabel('checking')).toBe('Corriente');
    expect(getAccountTypeLabel('credit_card')).toBe('Crédito');
    expect(getAccountTypeLabel('cash')).toBe('Efectivo');
    expect(getAccountTypeLabel('investment')).toBe('Inversión');

    expect(mapDbPatternToCardShape('solid')).toBe('none');
    expect(mapDbPatternToCardShape('geometric')).toBe('geo');
    expect(mapDbPatternToCardShape('mesh')).toBe('malla');
    expect(mapDbPatternToCardShape(undefined)).toBe('hojas');
  });
});
