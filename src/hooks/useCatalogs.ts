'use client'

import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInstitutions } from '@/lib/actions/institutions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';
import { getAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { useFilterStore } from '@/store/useFilterStore';
import { useSearchParams } from 'next/navigation';
import { getProfile, ProfileUpdateInput, updateProfile } from '@/lib/actions/profile';

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

// 💳 5. Hook para Transacciones (Paginación Real)
export function useTransactionsList(page: number = 1) { // 💡 Recibimos la página
  const filters = useFilterStore();
  const searchParams = useSearchParams();
  
  const urlAccountId = searchParams.get('accountId');

  return useQuery({
    // 💡 FUNDAMENTAL: Añadir `page` a la queryKey para que cachee cada página por separado
    queryKey: ['transactions', urlAccountId, filters.type, filters.categoryId, filters.startDate, filters.endDate, page],
    queryFn: async () => {
      const activeFilters = {
        ...(filters.type && { type: filters.type }), 
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      const response = await getTransactions({
        page: page, // 💡 Usamos la página que pide la UI
        pageSize: 10, // 💡 Lo igualamos al `itemsPerPage` de tu tabla
        accountId: urlAccountId || undefined, 
        filters: activeFilters 
      });

      // 💡 Devolvemos el objeto completo con { transactions, total }
      return response; 
    },
    placeholderData: keepPreviousData, 
  });
}

// 💡 HOOK PARA LEER EL PERFIL
export function useProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      return await getProfile();
    },
    // El perfil rara vez cambia solo, podemos cachearlo por buen tiempo
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
}

// 💡 HOOK PARA MUTAR EL PERFIL (Ej: Cambiar el primary_account_id)
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileUpdateInput) => {
      const response = await updateProfile(data);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      // Obliga a toda la app a recargar los datos del perfil instantáneamente
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}