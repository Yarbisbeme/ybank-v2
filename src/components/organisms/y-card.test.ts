import { describe, expect, it } from 'vitest';
import {
  CARD_METAL_HEX,
  CARD_PALETTE,
  getAccountTypeLabel,
  getCardBackgroundStyle,
  getCardLuminance,
  getCardSheenStyle,
  getCardTextTone,
  hexToWash,
  mapDbPatternToCardShape,
  mixHex,
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
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('rgb(128, 128, 128)');
  });

  it('computes material, metallic override, and pointer sheen styles', () => {
    const materia = getCardBackgroundStyle({ base: 'materia', color: CARD_PALETTE.ultramar });
    expect(String(materia.backgroundImage)).toContain('linear-gradient(155deg');

    const metal = getCardBackgroundStyle({
      base: 'plana',
      color: CARD_PALETTE.coral,
      finish: 'metal',
    });
    expect(metal.backgroundColor).toBe(CARD_METAL_HEX);

    expect(getCardSheenStyle('plana', 'mate', 30, 20)).toBeNull();
    expect(String(getCardSheenStyle('materia', 'mate', 30, 20)?.backgroundImage)).toContain(
      'radial-gradient(circle at 30% 20%',
    );
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
