'use client';

import { useState, useRef, useEffect } from 'react';
import { CreditCard, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Account } from '@/types';
import { Button } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { YCard } from './YCard';
import { hexToWash, mapDbPatternToCardShape } from './y-card';

export interface CardStackProps {
  accounts: Account[];
  activeAccountId?: string | null;
  onSelectAccount: (account: Account) => void;
  onCardClick?: (account: Account) => void;
  favoriteAccountId?: string | null;
  onToggleFavorite?: (accountId: string) => void;
  onAddAccount?: () => void;
  cardWidth?: number;
  bare?: boolean;
  className?: string;
}

function calculateSlot(delta: number, width: number) {
  const absDelta = Math.abs(delta);
  const sign = delta < 0 ? -1 : 1;
  const x =
    absDelta === 0
      ? 0
      : sign * (absDelta === 1 ? 0.34 : absDelta === 2 ? 0.56 : 0.66) * width;
  const scale =
    absDelta === 0 ? 1 : absDelta === 1 ? 0.84 : absDelta === 2 ? 0.7 : 0.6;
  const rot = absDelta === 0 ? 0 : sign * (absDelta === 1 ? 4 : 7);

  return {
    x,
    scale,
    rot,
    zIndex: 20 - absDelta,
    opacity: absDelta > 2 ? 0 : 1,
    dim: absDelta === 0 ? 0 : absDelta === 1 ? 0.28 : 0.45,
  };
}

/**
 * Authentic YBank 2.0 CardStack wallet carousel:
 * The active card sits at 100% in front.
 * Neighbor cards tuck in behind with 84% scale, 4deg rotation, and shade overlay.
 * Drag/swipe horizontally or use chevron buttons / arrow keys to switch cards.
 */
export function CardStack({
  accounts,
  activeAccountId,
  onSelectAccount,
  onCardClick,
  favoriteAccountId,
  onToggleFavorite,
  onAddAccount,
  cardWidth = 290,
  bare = false,
  className,
}: CardStackProps) {
  const initialIndex = Math.max(
    0,
    accounts.findIndex((acc) => acc.id === activeAccountId),
  );
  const [internalIndex, setInternalIndex] = useState(initialIndex);
  const [drag, setDrag] = useState<{ startX: number; deltaX: number } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync index if external activeAccountId changes
  useEffect(() => {
    if (activeAccountId) {
      const idx = accounts.findIndex((acc) => acc.id === activeAccountId);
      if (idx >= 0 && idx !== internalIndex) {
        setInternalIndex(idx);
      }
    }
  }, [activeAccountId, accounts, internalIndex]);

  if (accounts.length === 0) {
    return (
      <div
        className={cn(
          'rounded-panel border border-line bg-surface p-4',
          className,
        )}
      >
        <EmptyState
          icon={<CreditCard size={24} strokeWidth={2} />}
          title="Aún no tienes cuentas"
          description="Agrega tu primera cuenta o tarjeta para ver tu balance aquí."
          action={
            onAddAccount ? (
              <Button
                variant="primary"
                leftIcon={<Plus size={16} strokeWidth={2} />}
                onClick={onAddAccount}
              >
                Agregar cuenta
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const safeIndex = Math.max(0, Math.min(accounts.length - 1, internalIndex));
  const activeAccount = accounts[safeIndex];
  const activeColor =
    activeAccount?.color || activeAccount?.institution?.brand_color_primary;

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(accounts.length - 1, index));
    setInternalIndex(clamped);
    if (accounts[clamped]) {
      onSelectAccount(accounts[clamped]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(safeIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(safeIndex - 1);
    }
  };

  const stageHeight = Math.round(cardWidth / 1.586) + 28;
  const liveOffset = (drag?.deltaX ?? 0) / (cardWidth * 0.9);

  const content = (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Tus tarjetas"
      onKeyDown={handleKeyDown}
      className={cn('y2 y2-stack w-full focus-visible:outline-none', className)}
    >
      <div
        className={cn('stage', drag && 'dragging')}
        style={{ height: `${stageHeight}px` }}
        onPointerDown={(e) => {
          if (accounts.length <= 1) return;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setDrag({ startX: e.clientX, deltaX: 0 });
        }}
        onPointerMove={(e) => {
          if (drag) {
            setDrag({ startX: drag.startX, deltaX: e.clientX - drag.startX });
          }
        }}
        onPointerUp={() => {
          if (drag) {
            const delta = drag.deltaX;
            setDrag(null);
            if (delta < -cardWidth * 0.18) {
              goTo(safeIndex + 1);
            } else if (delta > cardWidth * 0.18) {
              goTo(safeIndex - 1);
            }
          }
        }}
        onPointerCancel={() => setDrag(null)}
      >
        {accounts.map((acc, k) => {
          const delta = k - safeIndex - liveOffset;
          const roundedDelta = Math.round(delta);
          const slot1 = calculateSlot(roundedDelta, cardWidth);
          const nextStep = roundedDelta + (delta > roundedDelta ? 1 : -1);
          const slot2 = calculateSlot(nextStep, cardWidth);
          const fraction = Math.abs(delta - roundedDelta);

          const posX = slot1.x + (slot2.x - slot1.x) * fraction;
          const posScale = slot1.scale + (slot2.scale - slot1.scale) * fraction;
          const posRot = slot1.rot + (slot2.rot - slot1.rot) * fraction;
          const isActive = k === safeIndex;

          return (
            <div
              key={acc.id}
              className="slot"
              aria-hidden={!isActive}
              style={{
                width: `${cardWidth}px`,
                marginLeft: `${-cardWidth / 2}px`,
                transform: `translateX(${posX.toFixed(1)}px) scale(${posScale.toFixed(3)}) rotate(${posRot.toFixed(2)}deg)`,
                zIndex: slot1.zIndex,
                opacity: slot1.opacity,
              }}
              onClick={() => {
                if (!isActive && !(drag && Math.abs(drag.deltaX) > 4)) {
                  goTo(k);
                }
              }}
            >
              <YCard
                name={acc.name}
                balance={acc.current_balance}
                currency={acc.currency}
                accountType={acc.type}
                bankName={acc.institution?.name}
                bankLogoUrl={acc.institution?.logo_url}
                last4={acc.last_4_digits}
                color={acc.color || acc.institution?.brand_color_primary}
                secondaryColor={acc.institution?.brand_color_secondary}
                shape={mapDbPatternToCardShape(
                  acc.custom_pattern || acc.institution?.card_pattern,
                )}
                active={isActive}
                tilt={isActive}
                isFavorite={favoriteAccountId === acc.id}
                onToggleFavorite={
                  onToggleFavorite ? () => onToggleFavorite(acc.id) : undefined
                }
                onClick={
                  isActive && onCardClick ? () => onCardClick(acc) : undefined
                }
              />
              <span
                className="shade"
                style={{ opacity: isActive ? 0 : slot1.dim }}
              />
            </div>
          );
        })}
      </div>

      {accounts.length > 1 ? (
        <div className="foot">
          <button
            type="button"
            aria-label="Tarjeta anterior"
            disabled={safeIndex === 0}
            onClick={() => goTo(safeIndex - 1)}
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <div
            className="segs"
            aria-label={`Tarjeta ${safeIndex + 1} de ${accounts.length}`}
          >
            {accounts.map((acc, k) => (
              <span key={acc.id} className={k === safeIndex ? 'on' : ''} />
            ))}
          </div>
          <button
            type="button"
            aria-label="Tarjeta siguiente"
            disabled={safeIndex === accounts.length - 1}
            onClick={() => goTo(safeIndex + 1)}
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      ) : null}
    </div>
  );

  if (bare) {
    return content;
  }

  return (
    <section
      aria-label="Tus cuentas"
      style={{ backgroundColor: hexToWash(activeColor ?? '', 0.12) }}
      className="rounded-panel border border-line p-4 sm:p-5 flex flex-col gap-4 transition-colors duration-250"
    >
      {content}
    </section>
  );
}
