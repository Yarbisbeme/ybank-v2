import { describe, expect, it } from 'vitest';
import {
  CARD_METAL_HEX,
  CARD_PALETTE,
  getAccountCardStyle,
  getAccountTypeLabel,
  getCardBackgroundStyle,
  getCardLuminance,
  getCardSheenStyle,
  getCardTextTone,
  hexToWash,
  mapDbPatternToCardShape,
  mixHex,
  resolveCardHex,
  toDbCardStyle,
} from './y-card';
import { createAccountSchema } from '@/lib/validation';

// Regression: the card designer kept base, second colour, intensity, finish and
// network in form state only, so every save dropped them.
describe('card style persistence mapping', () => {
  it('reads stored English values into the designer tokens', () => {
    expect(
      getAccountCardStyle({
        card_base: 'gradient',
        card_shape_intensity: 2,
        card_finish: 'metal',
        network: 'mastercard',
        color_secondary: '#e4572e',
      }),
    ).toEqual({
      base: 'degradado',
      secondaryColor: '#e4572e',
      shapeIntensity: 2,
      finish: 'metal',
      network: 'Mastercard',
    });
  });

  it('falls back to the column defaults and the institution colour', () => {
    expect(
      getAccountCardStyle({
        institution: { brand_color_secondary: '#0e0e10' },
      }),
    ).toEqual({
      base: 'materia',
      secondaryColor: '#0e0e10',
      shapeIntensity: 1,
      finish: 'mate',
      network: '',
    });
  });

  it('round-trips every designer option through the database values', () => {
    const bases = ['plana', 'degradado', 'materia'] as const;
    const finishes = ['mate', 'metal', 'holo'] as const;
    const networks = ['VISA', 'Mastercard', ''] as const;
    for (const base of bases) {
      for (const finish of finishes) {
        for (const network of networks) {
          const style = {
            base,
            finish,
            network,
            shapeIntensity: 0 as const,
            secondaryColor: base === 'degradado' ? '#1f4bff' : null,
          };
          expect(getAccountCardStyle(toDbCardStyle(style))).toEqual(style);
        }
      }
    }
  });

  it('produces values the server schema accepts', () => {
    const payload = toDbCardStyle({
      base: 'degradado',
      secondaryColor: '#1f4bff',
      shapeIntensity: 2,
      finish: 'holo',
      network: 'VISA',
    });
    const parsed = createAccountSchema.safeParse({
      name: 'Test',
      type: 'credit_card',
      currency: 'DOP',
      initial_balance: 0,
      credit_limit: 1000,
      is_active: true,
      ...payload,
    });
    expect(parsed.success).toBe(true);
  });

  it('only writes the second colour for gradient cards', () => {
    const common = {
      secondaryColor: '#1f4bff',
      shapeIntensity: 1 as const,
      finish: 'mate' as const,
      network: '' as const,
    };
    expect(toDbCardStyle({ ...common, base: 'materia' })).not.toHaveProperty(
      'color_secondary',
    );
    expect(toDbCardStyle({ ...common, base: 'degradado' }).color_secondary).toBe(
      '#1f4bff',
    );
    expect(
      toDbCardStyle({ ...common, base: 'degradado', secondaryColor: 'navy' }),
    ).not.toHaveProperty('color_secondary');
  });

  it('clears the network for cash accounts', () => {
    expect(
      toDbCardStyle(
        {
          base: 'plana',
          secondaryColor: null,
          shapeIntensity: 1,
          finish: 'mate',
          network: 'VISA',
        },
        { isCash: true },
      ).network,
    ).toBeNull();
  });
});

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
