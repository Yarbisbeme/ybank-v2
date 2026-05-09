// src/app/(dashboard)/accounts/page.tsx
import AccountDetailsHeader from '@/components/accounts/AccountDetailsHeader';
import AccountStageSelector from '@/components/accounts/AccountStageSelector';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';
import { createSupabaseClient } from '@/lib/supabase/createServerClient';
import { Zap } from 'lucide-react'; 
import { redirect } from 'next/navigation';

export default async function AccountsPage(props: { 
  searchParams: Promise<{ accountId?: string }> 
}) {
  const searchParams = await props.searchParams;
  const initialAccountId = searchParams.accountId;

  if (!initialAccountId) {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('primary_account_id')
        .eq('id', user.id)
        .single();

      if (profile?.primary_account_id) {
        redirect(`/accounts?accountId=${profile.primary_account_id}`);
      } else {
        const { data: firstAccount } = await supabase
          .from('accounts')
          .select('id')
          .limit(1)
          .single();
          
        if (firstAccount) {
          redirect(`/accounts?accountId=${firstAccount.id}`);
        }
      }
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto sm:px-4 md:px-8 sm:py-6 space-y-8 sm:pb-20">
      {/*
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hidden sm:block">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-muted-foreground" />
          <h1 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Control de Nodos
          </h1>
        </div>
      </div>

      <section>
        <AccountStageSelector initialAccountId={initialAccountId} />
      </section>

      <section>
        <AccountDetailsHeader />
      </section>

      <section className="pt-8">
        <div className="flex items-center gap-2 mb-4">
           <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
             Registro de Operaciones del Nodo
           </h2>
        </div>
        <TransactionFilterBar />
        <ClientTransactionTable /> 
      </section>
      */}
    </div>
  );
}