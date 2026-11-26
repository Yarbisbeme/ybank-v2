import type { CSSProperties } from 'react';
import type { AccountType, CustomPattern } from '@/types';

export type CardBase = 'plana' | 'degradado' | 'materia';
export type CardShape =
  | 'none'
  | 'hojas'
  | 'geo'
  | 'dots'
  | 'curve'
  | 'waves'
  | 'lines'
  | 'malla';
export type CardFinish = 'mate' | 'metal' | 'holo';
export type CardNetwork = 'VISA' | 'Mastercard' | '';

export type CardColorKey =
  | 'ultramar'
  | 'tinta'
  | 'coral'
  | 'lima'
  | 'menta'
  | 'marino'
  | 'vino'
  | 'rosa'
  | 'hueso'
  | 'turquesa'
  | 'uva'
  | 'oro';

/** Canonical 12-color YBank 2.0 user card palette (permitted hex registry). */
export const CARD_PALETTE: Record<CardColorKey, string> = {
  ultramar: '#1f4bff',
  tinta: '#0e0e10',
  coral: '#e4572e',
  lima: '#c6f432',
  menta: '#2bb673',
  marino: '#0b3d91',
  vino: '#7a1f2b',
  rosa: '#f2b8c6',
  hueso: '#f4f3ef',
  turquesa: '#00a3a3',
  uva: '#5b2a86',
  oro: '#d4a017',
};

export const CARD_METAL_HEX = '#b9b8b3';
export const YMARK_BIG_PATH =
  'M794.0 223.0 C945.6 309.2 812.3 573.2 653.0 495.0 C779.6 445.3 798.8 347.3 794.0 223.0Z';
export const YMARK_SMALL_PATH =
  'M651.0 223.0 C640.3 321.5 731.3 334.4 696.0 430.0 C803.7 374.2 754.0 245.0 651.0 223.0Z';

function parseHexRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

/** Linearly mixes two hex colors into an rgb() CSS value for material card depth. */
export function mixHex(hex: string, toHex: string, amount: number): string {
  const fromRgb = parseHexRgb(resolveCardHex(hex)) ?? [31, 75, 255];
  const toRgb = parseHexRgb(resolveCardHex(toHex)) ?? [14, 14, 16];
  const mixChannel = (idx: number) =>
    Math.round(fromRgb[idx] * (1 - amount) + toRgb[idx] * amount);
  return `rgb(${mixChannel(0)}, ${mixChannel(1)}, ${mixChannel(2)})`;
}

/** Resolves a CardColorKey or raw hex string into a normalized hex color. */
export function resolveCardHex(color?: string | null): string {
  if (!color) {
    return CARD_PALETTE.ultramar;
  }
  const key = color.toLowerCase() as CardColorKey;
  if (key in CARD_PALETTE) {
    return CARD_PALETTE[key];
  }
  const rgb = parseHexRgb(color);
  if (!rgb) {
    return CARD_PALETTE.ultramar;
  }
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Standard perceived luminance (0..255) used for automatic card text contrast. */
export function getCardLuminance(hex: string): number {
  const rgb = parseHexRgb(hex);
  if (!rgb) {
    return 0;
  }
  const [r, g, b] = rgb;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/** Switches card text to dark ink when luminance exceeds 150 (SKILL.md rule). */
export function getCardTextTone(hex: string): 'light' | 'dark' {
  return getCardLuminance(hex) > 150 ? 'dark' : 'light';
}

/** Returns exact foreground hex matching card luminance (with metal finish override). */
export function getCardInkHex(
  color?: string | null,
  finish: CardFinish = 'mate',
): string {
  const effectiveHex =
    finish === 'metal' ? CARD_METAL_HEX : resolveCardHex(color);
  return getCardTextTone(effectiveHex) === 'dark' ? '#0e0e10' : '#ffffff';
}

/** Computes a subtle section wash color (default 12% opacity) from the active card. */
export function hexToWash(hex: string, alpha = 0.12): string {
  const rgb = parseHexRgb(resolveCardHex(hex));
  if (!rgb) {
    return `rgba(31, 75, 255, ${alpha})`;
  }
  const [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Maps account types to clear Spanish labels (closes U1: savings is never DEBIT). */
export function getAccountTypeLabel(type: AccountType | string | undefined | null): string {
  switch (type) {
    case 'savings':
      return 'Ahorro';
    case 'checking':
      return 'Corriente';
    case 'credit_card':
      return 'Crédito';
    case 'cash':
      return 'Efectivo';
    case 'investment':
      return 'Inversión';
    default:
      return 'Cuenta';
  }
}

/** Maps persisted database card_pattern values into YCard 5-layer shape tokens. */
export function mapDbPatternToCardShape(
  pattern?: CustomPattern | string | null,
): CardShape {
  switch (pattern) {
    case 'solid':
      return 'none';
    case 'geometric':
      return 'geo';
    case 'mesh':
      return 'malla';
    case 'dots':
      return 'dots';
    case 'curve':
      return 'curve';
    case 'waves':
      return 'waves';
    case 'lines':
      return 'lines';
    case 'hojas':
      return 'hojas';
    default:
      return 'hojas';
  }
}

/** Builds inline surface styles for YCard base layers without exposing hexes in TSX. */
export function getCardBackgroundStyle(options: {
  base: CardBase;
  color?: string | null;
  secondaryColor?: string | null;
  finish?: CardFinish;
}): CSSProperties {
    const effectiveBase = options.finish === 'metal' ? 'materia' : options.base;
    const primary =
      options.finish === 'metal'
        ? CARD_METAL_HEX
        : resolveCardHex(options.color);

    if (effectiveBase === 'plana') {
      return { backgroundColor: primary };
    }

    if (effectiveBase === 'degradado') {
      const secondary = options.secondaryColor
        ? resolveCardHex(options.secondaryColor)
        : CARD_PALETTE.tinta;

      return {
        backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      };
    }

    const lightEdge = mixHex(primary, '#ffffff', 0.18);
    const darkEdge = mixHex(primary, '#000000', 0.28);
    return {
      backgroundColor: primary,
      backgroundImage: `linear-gradient(155deg, ${lightEdge} 0%, ${primary} 48%, ${darkEdge} 100%)`,
    };
  }

  /** Micro-texture overlay per finish matching YBank 2.0 bundle.js. */
  export function getCardTextureStyle(finish: CardFinish): CSSProperties | null {
    if (finish === 'metal') {
      return {
        backgroundImage:
          'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.18) 0 1px, rgba(0, 0, 0, 0.05) 1px 3px)',
      };
    }
    if (finish === 'mate') {
      return {
        backgroundImage:
          'repeating-radial-gradient(circle at 30% 40%, rgba(0, 0, 0, 0.05) 0 1px, transparent 1px 3px)',
      };
    }
    return null;
  }

  /** Pointer-reactive holographic conic spectrum layer. */
  export function getCardHoloStyle(px: number, py: number): CSSProperties {
    return {
      backgroundImage: `conic-gradient(from ${(px * 3.6).toFixed(1)}deg at ${px}% ${py}%, #ff8a8a, #ffe27a, #9cffb0, #8ad8ff, #c79bff, #ff8a8a)`,
    };
  }

  /** Dynamic pointer-driven specular sheen over material/gradient/metallic cards. */
  export function getCardSheenStyle(
    base: CardBase,
    finish: CardFinish,
    px: number,
    py: number,
  ): CSSProperties | null {
    if (base === 'plana' && finish === 'mate') {
      return null;
    }
    if (finish === 'metal') {
      return {
        backgroundImage: `linear-gradient(${100 + px * 0.6}deg, transparent ${px - 25}%, rgba(255, 255, 255, 0.6) ${px}%, transparent ${px + 25}%)`,
      };
    }
    const alpha = finish === 'holo' ? 0.45 : 0.26;
    return {
      backgroundImage: `radial-gradient(circle at ${px}% ${py}%, rgba(255, 255, 255, ${alpha}), transparent 55%)`,
    };
  }
