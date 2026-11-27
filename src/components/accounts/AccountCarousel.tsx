'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CreditCard, Plus } from 'lucide-react';
import type { Transaction } from '@/types';
import {
  useAccounts,
  useProfile,
  useTransactionsList,
  useUpdateProfile,
} from '@/hooks/useCatalogs';
import { useModalStore } from '@/store/useModalStore';
import { Button, IconButton, Skeleton, formatMoney } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import {
  CardStack,
  YCard,
  hexToWash,
  mapDbPatternToCardShape,
  resolveCardHex,
} from '@/components/organisms';

/** Tinted 12% wash accounts showcase matching YBank 2.0 Principle #1. */
export default function AccountCarousel() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const openModal = useModalStore((state) => state.openModal);

  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: txData } = useTransactionsList();
  const updateProfileMutation = useUpdateProfile();
  const [activeIndex, setActiveIndex] = useState(0);

  const primaryAccountId = profile?.primary_account_id;

  const sortedAccounts = useMemo(() => {
    if (accounts.length === 0) {
      return [];
    }
    if (!primaryAccountId) {
      return accounts;
    }

    const favoriteAcc = accounts.find((a) => a.id === primaryAccountId);
    if (!favoriteAcc) {
      return accounts;
    }

    return [
      favoriteAcc,
      ...accounts.filter((a) => a.id !== primaryAccountId),
    ];
  }, [accounts, primaryAccountId]);

      const transactions = useMemo(
        () =>
          (Array.isArray(txData)
            ? txData
            : txData?.transactions || []) as Transaction[],
        [txData],
      );

      const safeIndex =
        sortedAccounts.length === 0
          ? 0
          : Math.min(activeIndex, sortedAccounts.length - 1);
      const activeAccount = sortedAccounts[safeIndex];

      const activeMonthSpend = useMemo(() => {
        if (!activeAccount) {
          return 0;
        }
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth();
        let total = 0;

        for (const tx of transactions) {
          if (tx.account_id !== activeAccount.id || tx.type !== 'expense' || !tx.date) {
            continue;
          }
          const parsed = new Date(`${tx.date.slice(0, 10)}T00:00:00`);
          if (
            !Number.isNaN(parsed.getTime()) &&
            parsed.getFullYear() === curYear &&
            parsed.getMonth() === curMonth
          ) {
            total += Math.abs(Number(tx.amount) || 0);
          }
        }
        return total;
      }, [activeAccount, transactions]);

      const stepActive = (delta: -1 | 1) => {
        if (sortedAccounts.length === 0) {
          return;
        }
        const nextIdx =
          (safeIndex + delta + sortedAccounts.length) % sortedAccounts.length;
        setActiveIndex(nextIdx);
        const container = scrollRef.current;
        const child = container?.children[nextIdx] as HTMLElement | undefined;
        child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
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
        const activeBarHex = resolveCardHex(activeColor);
        const creditLimit = Number(activeAccount.credit_limit) || 0;
        const isCreditCard = activeAccount.type === 'credit_card' && creditLimit > 0;
        const creditUsed = isCreditCard
          ? Math.abs(Math.min(0, Number(activeAccount.current_balance) || 0))
          : 0;
        const barPercent = isCreditCard
          ? Math.min(100, Math.round((creditUsed / creditLimit) * 100))
          : activeMonthSpend > 0
            ? 100
            : 0;

        return (
                <section
                  aria-label="Tus tarjetas"
                  style={{ backgroundColor: hexToWash(activeColor ?? '', 0.12) }}
                  className="-mx-5 rounded-none px-5 py-4 md:mx-0 md:rounded-panel md:p-6 flex flex-col gap-3 md:gap-4 transition-colors duration-250"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h2 className="title text-ink">Tus tarjetas</h2>
                      <Link
                        href="/accounts"
                        className="hidden md:inline small text-action hover:underline"
                      >
                        Ver todas
                      </Link>
                    </div>

                      <div className="flex items-center gap-2">
                        <span className="card-number text-ink-2 mr-1">
                          {safeIndex + 1} / {sortedAccounts.length}
                        </span>

                        <div className="hidden md:flex items-center gap-1.5">
                          <IconButton
                            size="sm"
                            variant="surface"
                            aria-label="Tarjeta anterior"
                            onClick={() => stepActive(-1)}
                          >
                            <ChevronLeft size={16} strokeWidth={2} />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="surface"
                            aria-label="Tarjeta siguiente"
                            onClick={() => stepActive(1)}
                          >
                            <ChevronRight size={16} strokeWidth={2} />
                          </IconButton>
                        </div>
                      </div>
                    </div>

                    <div
                      ref={scrollRef}
                      className="hidden md:flex items-stretch gap-4 overflow-x-auto pb-2 pt-1 pl-1"
                    >
                      {sortedAccounts.map((acc, index) => {
                        const isSelected = index === safeIndex;
                        return (
                          <div key={acc.id} className="w-80 shrink-0">
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
                              active={isSelected}
                              isFavorite={profile?.primary_account_id === acc.id}
                              onToggleFavorite={() => handleToggleFavorite(acc.id)}
                              onClick={() => {
                                if (isSelected) {
                                  router.push(`/accounts?accountId=${acc.id}`);
                                } else {
                                  setActiveIndex(index);
                                }
                              }}
                            />
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => openModal('account')}
                        className="w-44 shrink-0 aspect-iso-card rounded-card border-2 border-dashed border-line-strong flex flex-col items-center justify-center gap-2 small text-ink-2 hover:border-ink hover:text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
                      >
                        <Plus size={20} strokeWidth={2} />
                        <span>Diseñar tarjeta</span>
                      </button>
                    </div>

                    <div className="md:hidden -mx-5">
                      <CardStack
                        accounts={sortedAccounts}
                        activeAccountId={activeAccount.id}
                        bare={true}
                        onSelectAccount={(acc) => {
                          const idx = sortedAccounts.findIndex((a) => a.id === acc.id);
                          if (idx >= 0) {
                            setActiveIndex(idx);
                          }
                        }}
                        onCardClick={(acc) => {
                          router.push(`/accounts?accountId=${acc.id}`);
                        }}
                        favoriteAccountId={profile?.primary_account_id}
                        onToggleFavorite={handleToggleFavorite}
                        onAddAccount={() => openModal('account')}
                      />
                    </div>

                    <div className="max-w-2xl flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 small">
                        <span className="text-ink-2">
                          {isCreditCard
                            ? `${activeAccount.name} · uso de límite`
                            : `${activeAccount.name} · gastos este mes`}
                        </span>

                        <div className="flex items-center gap-3 tabular-nums text-ink">
                          <span>
                            {isCreditCard
                              ? `${formatMoney(creditUsed, { currency: activeAccount.currency })} de ${formatMoney(creditLimit, { currency: activeAccount.currency })}`
                              : formatMoney(activeMonthSpend, { currency: activeAccount.currency })}
                          </span>
                          <Link
                            href={`/accounts?accountId=${activeAccount.id}`}
                            className="text-action hover:underline"
                          >
                            Ver detalle →
                          </Link>
                        </div>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-chip bg-surface/70">
                        <div
                          className="h-full transition-all duration-250"
                          style={{ width: `${barPercent}%`, backgroundColor: activeBarHex }}
                        />
                      </div>
                    </div>
                </section>
                );
}
