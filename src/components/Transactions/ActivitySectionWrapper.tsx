import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';
import { TransactionFilters as FilterType } from '@/types/database.types';
import ActivitySection from '@/components/Transactions/ActivitySection';

interface ActivityWrapperProps {
  // 💡 Recibe los parámetros de la URL desde la página padre
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ActivitySectionWrapper({ searchParams }: ActivityWrapperProps) {
  // 1. Parseamos los filtros
  const currentFilters: FilterType = {
    type: (searchParams.type as FilterType['type']) || null,
    categoryId: (searchParams.categoryId as string) || null,
    tagId: (searchParams.tagId as string) || null,
    accountId: (searchParams.accountId as string) || null,
    startDate: (searchParams.startDate as string) || null,
    endDate: (searchParams.endDate as string) || null,
  };

  // 2. Obtenemos datos concurrentemente
  const [accounts, categoriesTree, tags] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTags()
  ]);

  const flatCategories = categoriesTree.flatMap(c => [c, ...(c.subcategories || [])]);

  // 3. Obtenemos las transacciones filtradas
  const { transactions } = await getTransactions({ 
    pageSize: 20,
    accountId: currentFilters.accountId || undefined, 
    filters: currentFilters 
  });

  // 4. Retornamos el componente visual "tonto" (Dumb Component) ya con su data
  return (
    <ActivitySection 
      transactions={transactions}
      initialFilters={currentFilters}
      categories={flatCategories}
      tags={tags}
      accounts={accounts}
    />
  );
}