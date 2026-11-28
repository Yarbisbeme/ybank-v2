'use client';

import { useState, useRef } from 'react';
import { CreditCard, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Account } from '@/types';
import { Button } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { YCard } from './YCard';
import { computeCardFrame, computeLiveDragOffset } from './card-stack';
import {
  getAccountCardStyle,
  hexToWash,
  mapDbPatternToCardShape,
} from './y-card';

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
  const didDragRef = useRef(false);
  const capturedPointerIdRef = useRef<number | null>(null);

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

  const controlledIndex = activeAccountId
    ? accounts.findIndex((acc) => acc.id === activeAccountId)
    : -1;
  const safeIndex =
    controlledIndex >= 0
      ? controlledIndex
      : Math.max(0, Math.min(accounts.length - 1, internalIndex));
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

  const stageHeight = Math.round(cardWidth / 1.586) + 48;
  const liveOffset = computeLiveDragOffset(
    drag?.deltaX ?? 0,
    cardWidth,
    safeIndex,
    accounts.length,
  );

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
          didDragRef.current = false;
          capturedPointerIdRef.current = null;
          setDrag({ startX: e.clientX, deltaX: 0 });
        }}
        onPointerMove={(e) => {
          if (!drag) return;
          const deltaX = e.clientX - drag.startX;
          if (Math.abs(deltaX) > 6) {
            didDragRef.current = true;
            if (capturedPointerIdRef.current === null) {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              capturedPointerIdRef.current = e.pointerId;
            }
          }
          setDrag({ startX: drag.startX, deltaX });
        }}
        onPointerUp={(e) => {
          if (capturedPointerIdRef.current !== null) {
            e.currentTarget.releasePointerCapture?.(capturedPointerIdRef.current);
            capturedPointerIdRef.current = null;
          }
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
        onPointerCancel={(e) => {
          if (capturedPointerIdRef.current !== null) {
            e.currentTarget.releasePointerCapture?.(capturedPointerIdRef.current);
            capturedPointerIdRef.current = null;
          }
          setDrag(null);
        }}
      >
        {accounts.map((acc, k) => {
          const frame = computeCardFrame(k, safeIndex, liveOffset, cardWidth);
          const isActive = k === safeIndex;

          return (
            <div
              key={acc.id}
              className="slot"
              aria-hidden={!isActive}
              style={{
                width: `${cardWidth}px`,
                marginLeft: `${-cardWidth / 2}px`,
                transform: `translateX(${frame.x.toFixed(1)}px) scale(${frame.scale.toFixed(3)}) rotate(${frame.rot.toFixed(2)}deg)`,
                zIndex: frame.zIndex,
                opacity: frame.opacity,
              }}
              onClick={() => {
                if (!isActive && !didDragRef.current) {
                  goTo(k);
                }
              }}
            >
              <YCard
                name={acc.name}
                balance={acc.current_balance}
                creditLimit={acc.credit_limit}
                currency={acc.currency}
                accountType={acc.type}
                bankName={acc.institution?.name}
                bankLogoUrl={acc.institution?.logo_url}
                last4={acc.last_4_digits}
                color={acc.color || acc.institution?.brand_color_primary}
                {...getAccountCardStyle(acc)}
                shape={mapDbPatternToCardShape(
                  acc.custom_pattern || acc.institution?.card_pattern,
                )}
                active={false}
                tilt={isActive}
                isFavorite={favoriteAccountId === acc.id}
                onToggleFavorite={
                  onToggleFavorite ? () => onToggleFavorite(acc.id) : undefined
                }
                onClick={
                  isActive && onCardClick
                    ? () => {
                        if (!didDragRef.current) {
                          onCardClick(acc);
                        }
                      }
                    : undefined
                }
              />
              <span
                className="shade"
                style={{ opacity: frame.dim }}
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
