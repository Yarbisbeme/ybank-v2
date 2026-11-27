import { redirect } from 'next/navigation';
import type { Account, Category, Institution, Tag, Transaction } from '@/types';
import { getAccounts } from '@/lib/actions/accounts';
import { getCategories } from '@/lib/actions/categories';
import { getInstitutions } from '@/lib/actions/institutions';
import { getTags } from '@/lib/actions/tags';
import { getTransactions } from '@/lib/actions/transactions';
import { createSupabaseClient } from '@/lib/supabase/createServerClient';
import { TRANSACTIONS_PAGE_SIZE } from '@/lib/transaction-keys';
import DashboardProviders from '@/components/providers/DashboardProviders';
import { DashboardShell } from '@/components/templates';

interface DashboardInitialData {
  accounts: Account[];
  tags: Tag[];
  categories: Category[];
  institutions: Institution[];
  transactions: Transaction[];
  transactionsTotal: number;
}

interface DashboardProfile {
  onboarding_completed: boolean;
  primary_account_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseClient();

  // `redirect()` throws NEXT_REDIRECT, so it must never run inside a try/catch.
  // Invalid session -> sign-in. Network failure (Supabase unreachable) -> render
  // with empty data and let the persisted client cache serve the UI.
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const isNetworkFailure = authError?.name === 'AuthRetryableFetchError';
  if (!authData.user && !isNetworkFailure) {
    redirect('/sign-in?error=session_expired');
  }
  const user = authData.user;

  let profile: DashboardProfile = {
    onboarding_completed: true,
    primary_account_id: null,
    full_name: '',
    avatar_url: '',
  };

  let initialData: DashboardInitialData = {
    accounts: [],
    tags: [],
    categories: [],
    institutions: [],
    transactions: [],
    transactionsTotal: 0,
  };

  if (user) {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('onboarding_completed, primary_account_id, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileData) {
        profile = profileData;
      }

      const [accounts, txData, tags, categoriesTree, institutions] =
        await Promise.all([
          getAccounts(),
          getTransactions({ page: 1, pageSize: TRANSACTIONS_PAGE_SIZE }),
          getTags(),
          getCategories(),
          getInstitutions(),
        ]);

      initialData = {
        accounts,
        tags,
        categories: categoriesTree,
        institutions,
        transactions: txData.transactions,
        transactionsTotal: txData.total,
      };
    } catch (error) {
      // Keep the empty initialData so the persisted client cache is not overwritten.
      console.error('[dashboard] initial data fetch failed', error);
    }
  }

  const navbarUser = {
    name:
      profile.full_name ||
      (typeof user?.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : '') ||
      user?.email ||
      'Usuario',
    email: user?.email || '',
    avatarUrl:
      profile.avatar_url ||
      (typeof user?.user_metadata?.avatar_url === 'string'
        ? user.user_metadata.avatar_url
        : undefined),
  };

  return (
    <DashboardProviders
      initialData={initialData}
      primaryAccountId={profile.primary_account_id}
      institutionId={null}
    >
      <DashboardShell
        user={navbarUser}
        initialData={{
          accounts: initialData.accounts,
          transactions: initialData.transactions,
          categories: initialData.categories,
          tags: initialData.tags,
        }}
      >
        {children}
      </DashboardShell>
    </DashboardProviders>
  );
}
