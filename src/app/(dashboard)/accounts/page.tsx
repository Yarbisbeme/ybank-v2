'use client';

import { useSearchParams } from 'next/navigation';
import AccountStageSelector from '@/components/accounts/AccountStageSelector';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const initialAccountId = searchParams.get('accountId') || '';

  return (
    <div className="flex flex-col gap-6">
      <AccountStageSelector initialAccountId={initialAccountId} />

      <section aria-label="Movimientos" className="flex flex-col gap-3">
        <TransactionFilterBar bare title="Movimientos" />

        <ClientTransactionTable bare />
      </section>
    </div>
  );
}
