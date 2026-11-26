'use client';

import { useId } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccountType } from '@/types';
import { IconButton, Money, type CurrencyCode } from '@/components/atoms';
import {
  getAccountTypeLabel,
  getCardBackgroundStyle,
  getCardTextTone,
  resolveCardHex,
  type CardBase,
  type CardFinish,
  type CardNetwork,
  type CardShape,
} from './y-card';

export interface YCardProps {
  name: string;
  balance: number | string;
  currency?: CurrencyCode;
  accountType?: AccountType | string;
  bankName?: string | null;
  bankLogoUrl?: string | null;
  last4?: string | null;
  network?: CardNetwork;
  base?: CardBase;
  color?: string | null;
  secondaryColor?: string | null;
  shape?: CardShape;
  shapeIntensity?: 0 | 1 | 2;
  finish?: CardFinish;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
  className?: string;
}

const SHAPE_OPACITY: Record<0 | 1 | 2, number> = {
  0: 0.08,
  1: 0.14,
  2: 0.22,
};

/**
 * YBank 2.0 5-layer ISO card component (base, color, shape, finish, details).
 * Auto-adjusts text contrast from card luminance and labels account types cleanly (U1).
 */
export function YCard({
  name,
  balance,
  currency = 'DOP',
  accountType = 'savings',
  bankName,
  bankLogoUrl,
  last4,
  network = '',
  base = 'materia',
  color,
  secondaryColor,
  shape = 'hojas',
  shapeIntensity = 1,
  finish = 'mate',
  isFavorite = false,
  onToggleFavorite,
  onClick,
  className,
}: YCardProps) {
  const patternId = useId();
  const primaryHex = resolveCardHex(color);
  const textTone = getCardTextTone(primaryHex);
  const typeLabel = getAccountTypeLabel(accountType);
  const bankInitial = bankName?.trim().charAt(0).toUpperCase() || 'Y';

  const inkClass = textTone === 'dark' ? 'text-lime-ink' : 'text-white';
  const mutedInkClass =
    textTone === 'dark' ? 'text-lime-ink opacity-70' : 'text-white opacity-75';

  return (
    <article
      style={getCardBackgroundStyle({ base, color, secondaryColor })}
      className={cn(
        'relative w-full aspect-iso-card rounded-card overflow-hidden select-none flex flex-col justify-between p-5 border border-line',
        base === 'materia' ? 'card-base-materia' : 'shadow-card',
        inkClass,
        className,
      )}
    >
      {shape !== 'none' ? (
        <CardShapeLayer
          patternId={patternId}
          shape={shape}
          opacity={SHAPE_OPACITY[shapeIntensity]}
        />
      ) : null}

      {finish === 'metal' ? (
        <div
          aria-hidden="true"
          className="card-finish-metal pointer-events-none absolute inset-0 z-0"
        />
      ) : null}

      {finish === 'holo' ? (
        <div
          aria-hidden="true"
          className="card-finish-holo pointer-events-none absolute inset-0 z-0"
        />
      ) : null}

      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={`Abrir cuenta ${name}`}
          className="absolute inset-0 z-10 rounded-card cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
        />
      ) : null}

      <div className="relative z-10 flex items-start justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 min-w-0">
          {bankLogoUrl ? (
            <Image
              src={bankLogoUrl}
              alt={bankName ?? 'Institución'}
              width={96}
              height={28}
              unoptimized
              className="h-7 w-auto max-w-28 object-contain object-left"
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-chip border border-current/25 label"
              >
                {bankInitial}
              </span>
              <span className="small truncate">
                {bankName || typeLabel}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('label px-2 py-0.5 rounded-chip border border-current/25', mutedInkClass)}>
            {typeLabel}
          </span>

          {onToggleFavorite ? (
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={
                isFavorite ? `Quitar ${name} de favoritas` : `Marcar ${name} como favorita`
              }
              aria-pressed={isFavorite}
              onClick={onToggleFavorite}
              className={cn(
                'relative z-20 pointer-events-auto hover:bg-black/15',
                inkClass,
              )}
            >
              <Star
                size={16}
                strokeWidth={2}
                className={isFavorite ? 'fill-current' : 'opacity-80'}
              />
            </IconButton>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 my-auto pointer-events-none">
        <p className={cn('small mb-1 truncate', mutedInkClass)}>{name}</p>
        <Money
          value={balance}
          currency={currency}
          size="card"
          className="text-inherit block truncate"
        />
      </div>

      <div className="relative z-10 flex items-end justify-between gap-3 pointer-events-none">
        {last4 ? (
          <span className={cn('card-number', mutedInkClass)}>
            •••• {last4}
          </span>
        ) : (
          <span />
        )}

        {network ? (
          <span className={cn('label', mutedInkClass)}>{network}</span>
        ) : null}
      </div>
    </article>
  );
}

function CardShapeLayer({
  patternId,
  shape,
  opacity,
}: {
  patternId: string;
  shape: Exclude<CardShape, 'none'>;
  opacity: number;
}) {
  return (
    <svg
      aria-hidden="true"
      style={{ opacity }}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    >
      {shape === 'hojas' ? (
        <>
          <defs>
            <pattern
              id={patternId}
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
            >
              <g transform="translate(8 6) scale(0.14)">
                <path
                  fill="currentColor"
                  d="M154 8 C305 94 172 358 13 280 C139 230 158 132 154 8Z"
                />
                <path
                  fill="currentColor"
                  d="M11 8 C0 106 91 119 56 215 C163 159 114 30 11 8Z"
                />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </>
      ) : null}

      {shape === 'dots' ? (
        <>
          <defs>
            <pattern
              id={patternId}
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="4" cy="4" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </>
      ) : null}

      {shape === 'lines' ? (
        <>
          <defs>
            <pattern
              id={patternId}
              width="24"
              height="24"
              patternTransform="rotate(28)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="24"
                stroke="currentColor"
                strokeWidth="2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </>
      ) : null}

      {shape === 'malla' ? (
        <>
          <defs>
            <pattern
              id={patternId}
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 28 0 L 0 0 0 28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </>
      ) : null}

      {shape === 'geo' ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="72%" y="12%" width="56" height="56" rx="8" transform="rotate(14 260 40)" />
          <rect x="58%" y="56%" width="84" height="84" rx="10" transform="rotate(-12 220 150)" />
          <rect x="8%" y="62%" width="40" height="40" rx="6" />
        </g>
      ) : null}

      {shape === 'curve' ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="95%" cy="105%" r="48%" />
          <circle cx="95%" cy="105%" r="72%" />
          <circle cx="95%" cy="105%" r="96%" />
        </g>
      ) : null}

      {shape === 'waves' ? (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M-20,60 Q80,15 180,60 T380,60" />
          <path d="M-20,96 Q80,51 180,96 T380,96" />
          <path d="M-20,132 Q80,87 180,132 T380,132" />
        </g>
      ) : null}
    </svg>
  );
}
