'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CreditCard, Plus } from 'lucide-react';
import { useAccounts, useProfile, useUpdateProfile } from '@/hooks/useCatalogs';
import { useModalStore } from '@/store/useModalStore';
import { Button, IconButton, Skeleton } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import {
  CardStack,
  YCard,
  mapDbPatternToCardShape,
} from '@/components/organisms';

/** Responsive accounts showcase on /dashboard using YCard on desktop and CardStack on mobile. */
export default function AccountCarousel() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const openModal = useModalStore((state) => state.openModal);

  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const [selectedMobileId, setSelectedMobileId] = useState<string | null>(null);

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

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    const offset = 340;
    container.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    });
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

  if (sortedAccounts.length === 0) {
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
              Agregar cuenta
            </Button>
          }
        />
      </div>
    );
  }

  const activeMobileAccountId =
    selectedMobileId && sortedAccounts.some((a) => a.id === selectedMobileId)
      ? selectedMobileId
      : sortedAccounts[0].id;

  return (
    <section aria-label="Tus cuentas" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="title text-ink">Tus cuentas</h2>
          <span className="rounded-chip bg-surface-sunk px-2 py-0.5 label text-ink-2 tabular-nums">
            {sortedAccounts.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/accounts"
            className="small text-action hover:underline mr-1"
          >
            Ver todas
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <IconButton
              size="sm"
              variant="surface"
              aria-label="Desplazar cuentas a la izquierda"
              onClick={() => handleScroll('left')}
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </IconButton>
            <IconButton
              size="sm"
              variant="surface"
              aria-label="Desplazar cuentas a la derecha"
              onClick={() => handleScroll('right')}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </IconButton>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="hidden md:flex gap-4 overflow-x-auto pb-2"
      >
        {sortedAccounts.map((acc) => (
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
              isFavorite={profile?.primary_account_id === acc.id}
              onToggleFavorite={() => handleToggleFavorite(acc.id)}
              onClick={() => router.push(`/accounts?accountId=${acc.id}`)}
            />
          </div>
        ))}
      </div>

      <div className="md:hidden">
        <CardStack
          accounts={sortedAccounts}
          activeAccountId={activeMobileAccountId}
          onSelectAccount={(acc) => setSelectedMobileId(acc.id)}
          favoriteAccountId={profile?.primary_account_id}
          onToggleFavorite={handleToggleFavorite}
          onAddAccount={() => openModal('account')}
        />
      </div>
    </section>
  );
}
