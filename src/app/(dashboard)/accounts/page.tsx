'use client';

import { useSearchParams } from 'next/navigation';
import AccountDetailsHeader from '@/components/accounts/AccountDetailsHeader';
import AccountStageSelector from '@/components/accounts/AccountStageSelector';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const initialAccountId = searchParams.get('accountId') || '';

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="title-l text-ink">Tus cuentas</h1>
        <p className="small text-ink-2">
          Cambia de cuenta para revisar su balance, editarla o filtrar sus movimientos.
        </p>
      </div>

      <AccountStageSelector initialAccountId={initialAccountId} />

      <AccountDetailsHeader />

      <section aria-label="Movimientos de la cuenta" className="flex flex-col gap-4">
        <h2 className="title text-ink">Movimientos de la cuenta</h2>
        <TransactionFilterBar />
        <ClientTransactionTable />
      </section>
    </div>
  );
}
