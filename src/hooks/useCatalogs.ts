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

export function useTransactionsList() {
  const filters = useFilterStore();
  const searchParams = useSearchParams();
  
  const urlAccountId = searchParams.get('accountId');

  return useQuery({
    queryKey: ['transactions', urlAccountId, filters.type, filters.categoryId, filters.startDate, filters.endDate],
    queryFn: async () => {
      // 💡 Limpiamos estrictamente el objeto para no enviar "null" o "undefined" al backend
      const activeFilters = {
        ...(filters.type && { type: filters.type }), 
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      const response = await getTransactions({
        page: 1, // 💡 Aseguramos mandar la página
        pageSize: 20,
        accountId: urlAccountId || undefined, 
        filters: activeFilters 
      });

      return response.transactions;
    },
    // 💡 Ya no bloqueamos la petición inicial con initialData
    // placeholderData (keepPreviousData) mantendrá los datos en pantalla 
    // mientras el spinner de arriba carga los nuevos filtros.
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