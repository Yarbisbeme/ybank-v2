"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { TransactionFilters as FilterType } from '@/types/database.types';
import TransactionFilters from './TransactionFilter';

interface Props {
  initialFilters: FilterType;
  categories: any[];
  tags: any[];
  accounts: any[];
}

export default function TransactionFiltersWrapper({ initialFilters, categories, tags, accounts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (newFilters: FilterType) => {
    // Construimos la nueva URL basada en los filtros activos
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Actualizamos la URL (esto triggeréa un re-render del Server Component)
    // scroll: false evita que la página salte hacia arriba al filtrar
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <TransactionFilters 
      currentFilters={initialFilters} 
      onFilterChange={handleFilterChange}
      categories={categories}
      tags={tags}
      accounts={accounts}
    />
  );
}