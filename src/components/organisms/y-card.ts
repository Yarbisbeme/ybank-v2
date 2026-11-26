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
}): CSSProperties {
  const primary = resolveCardHex(options.color);
  if (options.base !== 'degradado') {
    return { backgroundColor: primary };
  }

  const secondary = options.secondaryColor
    ? resolveCardHex(options.secondaryColor)
    : CARD_PALETTE.marino;

  return {
    backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
  };
}
