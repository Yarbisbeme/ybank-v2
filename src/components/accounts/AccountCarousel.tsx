'use client';

import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@teispace/next-themes';
import { ChevronLeft, ChevronRight, CreditCard, Plus } from 'lucide-react';
import type { Account } from '@/types';
import {
  useAccounts,
  useProfile,
  useUpdateProfile,
} from '@/hooks/useCatalogs';
import { useAccountMonthMetrics } from '@/hooks/useMetrics';
import { useModalStore } from '@/store/useModalStore';
import { Button, IconButton, Skeleton, formatMoney } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import {
  CardStack,
  YCard,
  getAccountCardStyle,
  getCardWashAlpha,
  hexToWash,
  mapDbPatternToCardShape,
} from '@/components/organisms';
import {
  computeAccountBarModel,
  createCarouselSelection,
  requestCarouselSelection,
  resolveCarouselIndex,
  sortAccountsByPrimary,
  syncCarouselSelectionFromProp,
  type CreditUsageTone,
} from './account-carousel';

const emptySubscribe = () => () => { };

const CREDIT_BAR_CLASSES: Record<CreditUsageTone, string> = {
  credit: 'bg-credit',
  pending: 'bg-pending',
  debit: 'bg-debit',
};

const CREDIT_TEXT_CLASSES: Record<CreditUsageTone, string> = {
  credit: 'text-credit',
  pending: 'text-pending',
  debit: 'text-debit',
};

export interface AccountCarouselProps {
  activeAccountId?: string | null;
  onActiveAccountChange?: (account: Account) => void;
  onActiveCardClick?: (account: Account) => void;
  title?: string;
  showFooterSummary?: boolean;
  layoutMode?: 'responsive' | 'stack';
  sideContent?: React.ReactNode;
}

/** Tinted wash accounts showcase matching YBank 2.0 desktop rail and mobile/stack CardStack. */
export default function AccountCarousel({
  activeAccountId,
  onActiveAccountChange,
  onActiveCardClick,
  title = 'Tus tarjetas',
  showFooterSummary = true,
  layoutMode = 'responsive',
  sideContent,
}: AccountCarouselProps = {}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const openModal = useModalStore((state) => state.openModal);
  const { resolvedTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const isDark = isHydrated && resolvedTheme === 'dark';

  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const [selection, setSelection] = useState(() =>
    createCarouselSelection(activeAccountId),
  );

  // Adjusting state during render (not in an effect) so a URL change made
  // outside the carousel is reflected without painting the stale card first.
  if ((activeAccountId ?? null) !== selection.syncedPropId) {
    setSelection(syncCarouselSelectionFromProp(selection, activeAccountId));
  }

  const primaryAccountId = profile?.primary_account_id;

  const sortedAccounts = useMemo(
    () => sortAccountsByPrimary(accounts, primaryAccountId),
    [accounts, primaryAccountId],
  );

  const safeIndex = resolveCarouselIndex(sortedAccounts, selection.selectedId);
  const activeAccount = sortedAccounts[safeIndex];

  // Complete monthly figures from Postgres (the table only holds one page of movements).
  const { data: activeMetrics } = useAccountMonthMetrics(activeAccount?.id);
  const activeMonthSummary = {
    monthSpend: activeMetrics?.month_spend ?? 0,
    monthCount: activeMetrics?.month_count ?? 0,
  };

  const scrollToCard = (index: number) => {
    const container = scrollRef.current;
    const child = container?.children[index] as HTMLElement | undefined;
    if (container && child) {
      const containerRect = container.getBoundingClientRect();
      const childRect = child.getBoundingClientRect();
      const targetLeft =
        container.scrollLeft + (childRect.left - containerRect.left) - 24;
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      });
    }
  };

  const selectAccount = (acc: Account) => {
    setSelection((prev) =>
      requestCarouselSelection(prev, acc.id, Boolean(onActiveAccountChange)),
    );
    onActiveAccountChange?.(acc);
  };

  const selectIndex = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(sortedAccounts.length - 1, nextIdx));
    scrollToCard(clamped);
    const nextAcc = sortedAccounts[clamped];
    if (nextAcc) {
      selectAccount(nextAcc);
    }
  };

  const handleActiveCardTrigger = (acc: Account) => {
    if (onActiveCardClick) {
      onActiveCardClick(acc);
      return;
    }
    router.push(`/accounts?accountId=${acc.id}`);
  };

  const stepActive = (delta: -1 | 1) => {
    if (sortedAccounts.length === 0) {
      return;
    }
    const nextIdx = Math.max(
      0,
      Math.min(sortedAccounts.length - 1, safeIndex + delta),
    );
    if (nextIdx === safeIndex) {
      return;
    }
    selectIndex(nextIdx);
  };

  const handleToggleFavorite = (accountId: string) => {
    const nextPrimaryId =
      profile?.primary_account_id === accountId ? null : accountId;
    updateProfileMutation.mutate({ primary_account_id: nextPrimaryId });
  };

  if (isLoadingAccounts || isLoadingProfile) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton variant="card" label="Cargando cuentas" />
        <Skeleton variant="card" className="hidden md:block" />
      </div>
    );
  }

  if (!activeAccount) {
    return (
      <div className="rounded-panel border border-line bg-surface p-4">
        <EmptyState
          icon={<CreditCard size={24} strokeWidth={2} />}
          title="Aún no tienes cuentas registradas"
          description="Agrega tu cuenta bancaria, tarjeta o efectivo para empezar."
          action={
            <Button
              variant="primary"
              leftIcon={<Plus size={16} strokeWidth={2} />}
              onClick={() => openModal('account')}
            >
              Diseñar tarjeta
            </Button>
          }
        />
      </div>
    );
  }

  const activeColor =
    activeAccount.color || activeAccount.institution?.brand_color_primary;
  const barModel = computeAccountBarModel(activeAccount, activeMonthSummary);

  const handleStackSelect = (acc: Account) => {
    if (sortedAccounts.some((a) => a.id === acc.id)) {
      selectAccount(acc);
    }
  };

  const sharedStackProps = {
    accounts: sortedAccounts,
    activeAccountId: activeAccount.id,
    bare: true,
    onSelectAccount: handleStackSelect,
    onCardClick: handleActiveCardTrigger,
    favoriteAccountId: profile?.primary_account_id,
    onToggleFavorite: handleToggleFavorite,
    onAddAccount: () => openModal('account'),
  };

  const isStackOnly = layoutMode === 'stack';

  return (
    <>
      <section
        aria-label="Tus tarjetas"
      style={{
        backgroundColor: hexToWash(activeColor ?? '', getCardWashAlpha(isDark)),
      }}
      className={
        isStackOnly
          ? '-mx-5 md:-mx-6 lg:mx-0 overflow-hidden rounded-none lg:rounded-panel px-5 py-4 md:px-6 md:py-5 flex flex-col gap-3 md:gap-4 transition-colors duration-250'
          : '-mx-5 md:-mx-6 lg:mx-0 overflow-hidden rounded-none lg:rounded-panel px-5 py-4 md:px-0 md:py-5 flex flex-col gap-3 md:gap-4 transition-colors duration-250'
      }
    >
      <div
        className={
          isStackOnly
            ? 'flex flex-wrap items-center justify-between gap-3'
            : 'flex flex-wrap items-center justify-between gap-3 md:px-6'
        }
      >
        <h2 className="title text-ink">{title}</h2>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus size={15} strokeWidth={2} />}
            aria-label="Diseñar nueva tarjeta"
            onClick={() => openModal('account')}
          >
            Nueva
          </Button>

          {!isStackOnly ? (
            <div className="hidden md:flex items-center gap-1.5">
              <IconButton
                size="sm"
                variant="surface"
                aria-label="Tarjeta anterior"
                disabled={safeIndex === 0}
                onClick={() => stepActive(-1)}
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </IconButton>
              <IconButton
                size="sm"
                variant="surface"
                aria-label="Tarjeta siguiente"
                disabled={safeIndex === sortedAccounts.length - 1}
                onClick={() => stepActive(1)}
              >
                <ChevronRight size={16} strokeWidth={2} />
              </IconButton>
            </div>
          ) : null}
        </div>
      </div>

      {!isStackOnly ? (
        <>
          <div
            ref={scrollRef}
            className="relative hidden md:flex items-stretch gap-4 w-full overflow-x-auto y2-rail-hidden scroll-px-6 pt-2 pb-8 -mb-6 px-6"
          >
            {sortedAccounts.map((acc, index) => {
              const isSelected = index === safeIndex;
              return (
                <div key={acc.id} className="w-85 shrink-0">
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
                    active={isSelected}
                    isFavorite={profile?.primary_account_id === acc.id}
                    onToggleFavorite={() => handleToggleFavorite(acc.id)}
                    onClick={() => {
                      if (isSelected) {
                        handleActiveCardTrigger(acc);
                      } else {
                        selectIndex(index);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="md:hidden -mx-5">
            <CardStack {...sharedStackProps} />
          </div>
        </>
      ) : (
        <div
          className={
            sideContent
              ? 'grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch'
              : 'w-full'
          }
        >
          <div className={sideContent ? 'lg:col-span-7' : 'w-full'}>
            <div className="hidden md:block">
              <CardStack {...sharedStackProps} cardWidth={310} />
            </div>

            <div className="md:hidden -mx-5">
              <CardStack {...sharedStackProps} />
            </div>
          </div>

          {sideContent ? (
            <div className="hidden lg:flex lg:col-span-5 lg:flex-col lg:border-l lg:border-line lg:pl-8">
              {sideContent}
            </div>
          ) : null}
        </div>
      )}

      {showFooterSummary ? (
        <div className="w-full md:px-6">
          <div className="border-t border-line pt-3">
            {barModel.isCreditCard ? (
              <div className="min-h-10 md:min-h-8 flex items-center justify-between gap-4 small">
                <div className="min-w-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <span className="text-ink-2">Disponible</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {formatMoney(barModel.creditAvailable, {
                      currency: activeAccount.currency,
                    })}
                  </span>
                  <span className="text-ink-2 tabular-nums">
                    · Límite{' '}
                    {formatMoney(barModel.creditLimit, {
                      currency: activeAccount.currency,
                    })}
                  </span>
                  {barModel.cutoffDay ? (
                    <span className="hidden md:inline text-ink-2">
                      · Corta el {barModel.cutoffDay}
                    </span>
                  ) : null}
                </div>

                <div className="shrink-0 flex items-center gap-2.5">
                  <div
                    role="meter"
                    aria-label={barModel.label}
                    aria-valuenow={barModel.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="w-20 sm:w-28 h-2 overflow-hidden rounded-chip y2-track"
                  >
                    <div
                      className={`h-full transition-all duration-250 ${CREDIT_BAR_CLASSES[barModel.creditTone]}`}
                      style={{ width: `${barModel.percent}%` }}
                    />
                  </div>

                  <span
                    className={`tabular-nums font-semibold ${CREDIT_TEXT_CLASSES[barModel.creditTone]}`}
                  >
                    {barModel.percent}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="min-h-10 md:min-h-8 flex items-center justify-between gap-4 small">
                <span className="text-ink-2">{barModel.label}</span>

                <div className="shrink-0">
                  {barModel.monthSpend > 0 ? (
                    <span className="tabular-nums text-ink">
                      −{' '}
                      {formatMoney(barModel.monthSpend, {
                        currency: activeAccount.currency,
                      })}{' '}
                      <span className="text-ink-2">
                        · {barModel.monthCount} mov.
                      </span>
                    </span>
                  ) : (
                    <span className="text-ink-2">Sin gastos este mes</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
      </section>
      {sideContent ? <div className="lg:hidden">{sideContent}</div> : null}
    </>
  );
}
