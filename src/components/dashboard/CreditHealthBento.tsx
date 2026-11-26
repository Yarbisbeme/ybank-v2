'use client';

import { useMemo } from 'react';
import { useAccounts } from '@/hooks/useCatalogs';
import { useModalStore } from '@/store/useModalStore';
import { useYBankStore } from '@/store/useYBankStore';
import { HealthMeter } from '@/components/organisms';

/** Connects active credit card utilization and currency conversion state to HealthMeter ink block. */
export default function CreditHealthBento() {
  const { currency, preferredRate, isCalculatingRate } = useYBankStore();
  const { data: accounts = [], isLoading } = useAccounts();
  const openModal = useModalStore((state) => state.openModal);

  const cards = useMemo(
    () => accounts.filter((a) => a.type === 'credit_card' && a.is_active),
    [accounts],
  );

  const hasMixedCurrencies = cards.some((c) => c.currency !== currency);
  const hasRate = Boolean(preferredRate?.rate);
  const isWaitingForRate = hasMixedCurrencies && !hasRate && isCalculatingRate;
  const isRateUnavailable = hasMixedCurrencies && !hasRate && !isCalculatingRate;
  const isActuallyLoading = (isLoading && accounts.length === 0) || isWaitingForRate;

  const creditStats = useMemo(() => {
    if (cards.length === 0 || isWaitingForRate || isRateUnavailable) {
      return null;
    }

    let totalLimit = 0;
    let totalUsed = 0;

    for (const card of cards) {
      let rateMultiplier = 1;
      if (preferredRate && preferredRate.rate) {
        if (currency === 'DOP' && card.currency === 'USD') {
          rateMultiplier = preferredRate.rate;
        } else if (currency === 'USD' && card.currency === 'DOP') {
          rateMultiplier = 1 / preferredRate.rate;
        }
      }

      const limit = Number(card.credit_limit) || 0;
      totalLimit += limit * rateMultiplier;

      const balance = Number(card.current_balance) || 0;
      if (balance < 0) {
        totalUsed += Math.abs(balance) * rateMultiplier;
      }
    }

    const today = new Date().getDate();
    const nearestCutoff = cards.reduce((prev, curr) => {
      const day = curr.cutoff_day || 30;
      const diff = day > today ? day - today : 30 - today + day;
      return diff < prev ? diff : prev;
    }, 31);

    return {
      totalLimit,
      totalUsed,
      nearestCutoff,
    };
  }, [cards, currency, preferredRate, isWaitingForRate, isRateUnavailable]);

  return (
    <HealthMeter
      variant="ink"
      totalLimit={creditStats?.totalLimit ?? 0}
      totalUsed={creditStats?.totalUsed ?? 0}
      currency={currency}
      nearestCutoffDays={creditStats?.nearestCutoff ?? null}
      isLoading={isActuallyLoading}
      isRateUnavailable={isRateUnavailable}
      hasCards={cards.length > 0}
      actionHref={cards.length > 0 ? '/accounts' : undefined}
      actionLabel={cards.length > 0 ? 'Ver cómo mejorar' : 'Agregar tarjeta'}
      onAction={cards.length === 0 ? () => openModal('account') : undefined}
      className="h-full"
    />
  );
}
