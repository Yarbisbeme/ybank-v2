'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccounts, useProfile, useUpdateProfile } from '@/hooks/useCatalogs';
import { useModalStore } from '@/store/useModalStore';
import { Skeleton } from '@/components/atoms';
import { CardStack } from '@/components/organisms';

/** Account switcher on /accounts backed by CardStack and URL query synchronization. */
export default function AccountStageSelector({
  initialAccountId,
}: {
  initialAccountId?: string;
}) {
  const router = useRouter();
  const openModal = useModalStore((state) => state.openModal);
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const targetId =
    initialAccountId || profile?.primary_account_id || accounts[0]?.id || null;

  useEffect(() => {
    if (accounts.length === 0 || initialAccountId || !targetId) {
      return;
    }
    router.replace(`/accounts?accountId=${targetId}`, { scroll: false });
  }, [accounts.length, initialAccountId, targetId, router]);

  const handleToggleFavorite = (accountId: string) => {
    const nextPrimaryId =
      profile?.primary_account_id === accountId ? null : accountId;
    updateProfileMutation.mutate({ primary_account_id: nextPrimaryId });
  };

  if (isLoadingAccounts || isLoadingProfile) {
    return (
      <Skeleton
        variant="card"
        className="max-w-md mx-auto"
        label="Cargando cuentas"
      />
    );
  }

  return (
    <CardStack
      accounts={accounts}
      activeAccountId={targetId}
      onSelectAccount={(acc) =>
        router.push(`/accounts?accountId=${acc.id}`, { scroll: false })
      }
      favoriteAccountId={profile?.primary_account_id}
      onToggleFavorite={handleToggleFavorite}
      onAddAccount={() => openModal('account')}
    />
  );
}
