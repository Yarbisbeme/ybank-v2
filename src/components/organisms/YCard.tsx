'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccountType } from '@/types';
import { IconButton, Money, type CurrencyCode } from '@/components/atoms';
import {
  CARD_METAL_HEX,
  YMARK_BIG_PATH,
  YMARK_SMALL_PATH,
  getAccountTypeLabel,
  getCardBackgroundStyle,
  getCardHoloStyle,
  getCardInkHex,
  getCardSheenStyle,
  getCardTextTone,
  getCardTextureStyle,
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
  tilt?: boolean;
  active?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
  className?: string;
}

const SHAPE_OPACITY: Record<0 | 1 | 2, number> = {
  0: 0.12,
  1: 0.22,
  2: 0.4,
};

/**
 * YBank 2.0 5-layer ISO card component with pointer-driven 3D tilt, specular sheen,
 * auto-contrast ink, and clean borderless typography matching bundle.js.
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
  tilt = true,
  active = false,
  isFavorite = false,
  onToggleFavorite,
  onClick,
  className,
}: YCardProps) {
  const patternId = useId();
  const [pointer, setPointer] = useState({ on: false, x: 0.3, y: 0.2 });

  const effectiveBase: CardBase = finish === 'metal' ? 'materia' : base;
  const effectiveHex =
    finish === 'metal' ? CARD_METAL_HEX : resolveCardHex(color);
  const textTone = getCardTextTone(effectiveHex);
  const inkColor = getCardInkHex(color, finish);
  const typeLabel = getAccountTypeLabel(accountType);

  const inkClass = textTone === 'dark' ? 'text-lime-ink' : 'text-white';
  const mutedInkClass =
  textTone === 'dark' ? 'text-lime-ink opacity-80' : 'text-white opacity-85';

  const px = Math.round(pointer.x * 100);
  const py = Math.round(pointer.y * 100);
  const shouldTilt = tilt && effectiveBase !== 'plana' && pointer.on;

  const transformStyle = shouldTilt
    ? `rotateX(${((0.5 - pointer.y) * 14).toFixed(1)}deg) rotateY(${((pointer.x - 0.5) * 18).toFixed(1)}deg)`
    : 'none';

  const textureStyle = getCardTextureStyle(finish);
  const sheenStyle = getCardSheenStyle(effectiveBase, finish, px, py);

  return (
    <div
      className={cn('y2-card-perspective w-full', className)}
      onMouseMove={(e) => {
        if (!tilt) {
          return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          return;
        }
        setPointer({
          on: true,
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }}
      onMouseLeave={() => setPointer({ on: false, x: 0.3, y: 0.2 })}
    >
      <article
        style={{
          ...getCardBackgroundStyle({ base, color, secondaryColor, finish }),
          transform: transformStyle,
        }}
        className={cn(
          'relative w-full aspect-iso-card rounded-card overflow-hidden select-none flex flex-col justify-between p-5 transition-transform duration-200',
          effectiveBase === 'materia'
            ? 'y2-card-materia-shadow'
            : 'shadow-card-flat',
          active && 'y2-card-active-ring',
          inkClass,
        )}
      >
        {shape !== 'none' ? (
          <CardShapeLayer
            patternId={patternId}
            shape={shape}
            opacity={SHAPE_OPACITY[shapeIntensity]}
            inkColor={inkColor}
          />
        ) : null}

        {textureStyle ? (
          <div
            aria-hidden="true"
            style={textureStyle}
            className="pointer-events-none absolute inset-0 z-0"
          />
        ) : null}

        {finish === 'holo' ? (
          <div
            aria-hidden="true"
            style={getCardHoloStyle(px, py)}
            className="y2-card-holo-blend pointer-events-none absolute inset-0 z-0"
          />
        ) : null}

        {sheenStyle ? (
          <div
            aria-hidden="true"
            style={sheenStyle}
            className="pointer-events-none absolute inset-0 z-0"
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
                width={84}
                height={22}
                unoptimized
                className="h-5 w-auto max-w-24 object-contain object-left"
              />
            ) : (
              <span className="label uppercase tracking-wider truncate opacity-90">
                {bankName || typeLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn('nav', mutedInkClass)}>{typeLabel}</span>

            {onToggleFavorite ? (
              <IconButton
                size="sm"
                variant="ghost"
                aria-label={
                  isFavorite
                    ? `Quitar ${name} de favoritas`
                    : `Marcar ${name} como favorita`
                }
                aria-pressed={isFavorite}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={cn(
                  'relative z-20 pointer-events-auto h-7 w-7 hover:bg-black/15',
                  inkClass,
                )}
              >
                <Star
                  size={15}
                  strokeWidth={2}
                  className={isFavorite ? 'fill-current' : 'opacity-80'}
                />
              </IconButton>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 my-auto flex flex-col gap-0.5 pointer-events-none">
          <p className={cn('title-s truncate', mutedInkClass)}>{name}</p>
          <Money
            value={balance}
            currency={currency}
            size="card"
            className="text-inherit block truncate"
          />
        </div>

        <div className="relative z-10 flex items-end justify-between gap-3 pointer-events-none">
          <span className={cn('card-number', mutedInkClass)}>
            •••• {last4 || '0000'}
          </span>

          {network ? (
            <span
              className={cn(
                'title-s font-extrabold tracking-tight',
                network === 'VISA' && 'italic',
                inkClass,
              )}
            >
              {network}
            </span>
          ) : null}
        </div>
      </article>
    </div >
  );
}

function CardShapeLayer({
  patternId,
  shape,
  opacity,
  inkColor,
}: {
  patternId: string;
  shape: Exclude<CardShape, 'none'>;
  opacity: number;
  inkColor: string;
}) {
  if (shape === 'geo') {
    return (
      <div
        aria-hidden="true"
        style={{ opacity, color: inkColor }}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-6 left-7 h-28 w-28 rotate-12 rounded-card bg-current opacity-45" />
        <div className="absolute -bottom-12 right-5 h-36 w-36 rotate-45 rounded-sheet border-2 border-current" />
        <div className="absolute top-16 right-10 h-14 w-14 -rotate-12 rounded-tile border border-current" />
      </div>
    );
  }

  return (
    <svg
      aria-hidden="true"
      style={{ opacity, color: inkColor }}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    >
      {shape === 'hojas' ? (
        <>
          <defs>
            <pattern
              id={patternId}
              width="44"
              height="44"
              patternTransform="rotate(-8)"
              patternUnits="userSpaceOnUse"
            >
                <g
                  transform="translate(2 2) scale(0.13) translate(-640 -215)"
                  fill="currentColor"
                >
                  <path d={YMARK_BIG_PATH} />
                  <g transform="rotate(-15, 700, 350)">
                    <path d={YMARK_SMALL_PATH} />
                  </g>
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
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.6" fill="currentColor" />
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
              width="14"
              height="14"
              patternTransform="rotate(25)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="14"
                stroke="currentColor"
                strokeWidth="1.5"
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
              width="22"
              height="22"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 22 0 L 0 0 0 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </>
      ) : null}

      {shape === 'curve' ? (
          <g fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="105%" cy="125%" r="36%" />
            <circle cx="105%" cy="125%" r="58%" />
            <circle cx="105%" cy="125%" r="80%" />
          </g>
      ) : null}

          {shape === 'waves' ? (
              <g fill="currentColor">
                <path d="M0 150 Q85 110 171 150 T342 150 V216 H0Z" opacity="0.5" />
                <path d="M0 172 Q85 136 171 172 T342 172 V216 H0Z" opacity="0.7" />
              </g>
      ) : null}
            </svg>
          );
}
