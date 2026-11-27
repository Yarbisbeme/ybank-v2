'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccounts, useProfile } from '@/hooks/useCatalogs';
import { useModalStore } from '@/store/useModalStore';
import AccountCarousel from './AccountCarousel';
import AccountInsightSection from './AccountInsightSection';

/** Unified tonal-wash stage on /accounts pairing CardStack with AccountInsightSection. */
export default function AccountStageSelector({
  initialAccountId,
}: {
  initialAccountId?: string;
}) {
  const router = useRouter();
  const openModal = useModalStore((state) => state.openModal);
  const { data: accounts = [] } = useAccounts();
  const { data: profile } = useProfile();

  const targetId =
    initialAccountId || profile?.primary_account_id || accounts[0]?.id || null;

  useEffect(() => {
    if (accounts.length === 0 || initialAccountId || !targetId) {
      return;
    }
    router.replace(`/accounts?accountId=${targetId}`, { scroll: false });
  }, [accounts.length, initialAccountId, targetId, router]);

  return (
    <AccountCarousel
      activeAccountId={targetId}
      onActiveAccountChange={(acc) =>
        router.push(`/accounts?accountId=${acc.id}`, { scroll: false })
      }
      onActiveCardClick={(acc) => openModal('account', { accountId: acc.id })}
      showFooterSummary={false}
      layoutMode="stack"
      sideContent={<AccountInsightSection />}
    />
  );
}
