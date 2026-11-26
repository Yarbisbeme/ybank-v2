'use client';

import { useRef } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Account } from '@/types';
import { Button, Money } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { YCard } from './YCard';
import {
  getAccountTypeLabel,
  hexToWash,
  mapDbPatternToCardShape,
} from './y-card';

export interface CardStackProps {
  accounts: Account[];
  activeAccountId?: string | null;
  onSelectAccount: (account: Account) => void;
  favoriteAccountId?: string | null;
  onToggleFavorite?: (accountId: string) => void;
  onAddAccount?: () => void;
  className?: string;
}

/** Displays the active YCard inside a 12% tonal wash with keyboard-accessible account switcher. */
export function CardStack({
  accounts,
  activeAccountId,
  onSelectAccount,
  favoriteAccountId,
  onToggleFavorite,
  onAddAccount,
  className,
}: CardStackProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  const activeAccount =
    accounts.find((acc) => acc.id === activeAccountId) ?? accounts[0];
  const activeColor =
    activeAccount.color || activeAccount.institution?.brand_color_primary;

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }

    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + delta + accounts.length) % accounts.length;
    tabRefs.current[nextIndex]?.focus();
    onSelectAccount(accounts[nextIndex]);
  };

  return (
    <section
      aria-label="Tus cuentas"
      style={{ backgroundColor: hexToWash(activeColor ?? '', 0.12) }}
      className={cn(
        'rounded-panel border border-line p-4 sm:p-5 flex flex-col gap-4 transition-colors duration-250',
        className,
      )}
    >
      <div className="max-w-md w-full mx-auto">
        <YCard
          name={activeAccount.name}
          balance={activeAccount.current_balance}
          currency={activeAccount.currency}
          accountType={activeAccount.type}
          bankName={activeAccount.institution?.name}
          bankLogoUrl={activeAccount.institution?.logo_url}
          last4={activeAccount.last_4_digits}
          color={activeColor}
          secondaryColor={activeAccount.institution?.brand_color_secondary}
          shape={mapDbPatternToCardShape(
            activeAccount.custom_pattern ||
              activeAccount.institution?.card_pattern,
          )}
          isFavorite={favoriteAccountId === activeAccount.id}
          onToggleFavorite={
            onToggleFavorite
              ? () => onToggleFavorite(activeAccount.id)
              : undefined
          }
        />
      </div>

      {accounts.length > 1 ? (
        <div
          role="listbox"
          aria-label="Cambiar cuenta activa"
          className="flex items-stretch gap-2 overflow-x-auto pb-1"
        >
          {accounts.map((acc, index) => {
            const isSelected = acc.id === activeAccount.id;
            return (
              <button
                key={acc.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectAccount(acc)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={cn(
                  'flex min-w-44 shrink-0 flex-col items-start gap-1 rounded-tile border px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                  isSelected
                    ? 'border-action bg-surface text-ink'
                    : 'border-line bg-surface/80 text-ink-2 hover:bg-surface hover:text-ink',
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="small text-ink truncate">{acc.name}</span>
                  <span className="nav text-ink-2 shrink-0">
                    {getAccountTypeLabel(acc.type)}
                  </span>
                </div>
                <Money
                  value={acc.current_balance}
                  currency={acc.currency}
                  size="small"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
