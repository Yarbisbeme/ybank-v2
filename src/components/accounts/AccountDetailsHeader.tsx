'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pencil, Plus, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAccounts } from '@/hooks/useCatalogs';
import { useModalStore } from '@/store/useModalStore';
import { Button, Skeleton } from '@/components/atoms';

/** Contextual quick actions for the active account on /accounts. */
export default function AccountDetailsHeader() {
  const openModal = useModalStore((state) => state.openModal);
  const searchParams = useSearchParams();
  const urlAccountId = searchParams.get('accountId');

  const { data: accounts = [], isLoading } = useAccounts();

  const activeAccount = useMemo(() => {
    if (accounts.length === 0) {
      return null;
    }
    return accounts.find((a) => a.id === urlAccountId) || accounts[0];
  }, [accounts, urlAccountId]);

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Skeleton variant="line" className="h-10 w-72" />
      </div>
    );
  }

  if (!activeAccount) {
    return null;
  }

  const handleShare = async () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `YBank · ${activeAccount.name}`,
          text: `Resumen de mi cuenta ${activeAccount.name}`,
          url: currentUrl,
        });
        return;
      } catch {
        // User canceled native share; fallback is unnecessary.
        return;
      }
    }

    await navigator.clipboard.writeText(currentUrl);
    toast.success('Enlace de la cuenta copiado');
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button
        variant="primary"
        leftIcon={<Plus size={16} strokeWidth={2} />}
        onClick={() =>
          openModal('transaction', { accountId: activeAccount.id })
        }
      >
        Nuevo movimiento
      </Button>

      <Button
        variant="secondary"
        leftIcon={<Pencil size={16} strokeWidth={2} />}
        onClick={() => openModal('account', { accountId: activeAccount.id })}
      >
        Editar cuenta
      </Button>

      <Button
        variant="ghost"
        leftIcon={<Share2 size={16} strokeWidth={2} />}
        onClick={() => {
          void handleShare();
        }}
      >
        Compartir
      </Button>
    </div>
  );
}
