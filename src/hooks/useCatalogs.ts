'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getInstitutions } from '@/lib/actions/institutions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';
import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { useFilterStore } from '@/store/useFilterStore';

// 🏦 1. Hook para Instituciones (Bancos)
export function useInstitutions() {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: async () => await getInstitutions(),
    staleTime: 24 * 60 * 60 * 1000, 
  });
}

// 📂 2. Hook para Categorías
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => await getCategories(),
    staleTime: 24 * 60 * 60 * 1000, 
  });
}

// 🏷️ 3. Hook para Etiquetas (Tags)
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => await getTags(),
    staleTime: 10 * 60 * 1000, 
  });
}

// 💳 4. Hook para Cuentas
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => await getAccounts(),
    staleTime: 60 * 1000, 
  });
}

export function useTransactionsList(initialData: any[]) {
  const filters = useFilterStore();

  // 💡 FIX 2: Detectamos si el usuario ha tocado algún filtro
  const hasActiveFilters = !!(filters.type || filters.categoryId || filters.startDate || filters.endDate);

  return useQuery({
    queryKey: ['transactions', filters.accountId, filters.type, filters.categoryId, filters.startDate, filters.endDate],
    queryFn: async () => {
      const response = await getTransactions({
        pageSize: 20,
        accountId: filters.accountId || undefined,
        filters: {
          type: filters.type,
          categoryId: filters.categoryId,
          startDate: filters.startDate,
          endDate: filters.endDate,
        }
      });
      return response.transactions;
    },
    // 💡 FIX 3: Solo usamos los datos del servidor si NO hay filtros activos.
    initialData: hasActiveFilters ? undefined : initialData,
    
    // 💡 FIX 4: UX Magia. Mientras busca los datos nuevos en la BD, 
    placeholderData: keepPreviousData,
  });
}