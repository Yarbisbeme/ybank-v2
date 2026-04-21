import { Suspense } from 'react';
import TransactionModal from './TransactionModal';
import { getAccounts } from '@/lib/actions/accounts';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';

export default async function TransactionModalWrapper() {
  // 💡 1. Usamos tus funciones seguras para evitar problemas de RLS/Sesión
  const [accounts, categoriesTree, tags] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTags()
  ]);

  // 💡 2. Aplanamos las categorías (Padres e Hijas juntas) para el selector
  const flatCategories = categoriesTree.flatMap(c => [c, ...(c.subcategories || [])]);

  return (
    <Suspense fallback={null}>
      <TransactionModal 
        accounts={accounts || []} 
        tags={tags || []} 
        categories={flatCategories || []} 
      />
    </Suspense>
  );
}