'use client'

import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInstitutions } from '@/lib/actions/institutions';
import { getCategories } from '@/lib/actions/categories';
import { createTag, getTags } from '@/lib/actions/tags';
import { createAccount, getAccounts, updateAccount } from '@/lib/actions/accounts';
import { getTransactions, saveTransaction, deleteTransaction, updateSubTransaction } from '@/lib/actions/transactions';
import { useFilterStore } from '@/store/useFilterStore';
import { useSearchParams } from 'next/navigation';
import { getProfile, updateProfile } from '@/lib/actions/profile';
import { toast } from 'sonner';
import { ProfileUpdateInput } from '@/types';

// Helper para comprobar si el navegador está offline de manera síncrona
const isOffline = () => typeof window !== 'undefined' && !navigator.onLine;

// 🏦 1. Hook para Instituciones (Bancos)
export function useInstitutions() {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: async () => await getInstitutions(),
    staleTime: 24 * 60 * 60 * 1000, 
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst', // 💡 TanStack Query resolverá desde caché de inmediato si no hay red
  });
}

// 📂 2. Hook para Categorías
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => await getCategories(),
    staleTime: 24 * 60 * 60 * 1000, 
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst',
  });
}

// 🏷️ 3. Hook para Etiquetas (Tags)
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => await getTags(),
    staleTime: 10 * 60 * 1000, 
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst',
  });
}

// 💳 4. Hook para Cuentas
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => await getAccounts(),
    staleTime: 60 * 1000, 
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst',
  });
}

// 💳 5. Hook para Transacciones (Paginación Real adaptada a Offline)
export function useTransactionsList(page: number = 1) {
  const filters = useFilterStore();
  const searchParams = useSearchParams();
  const { data: accounts = [] } = useAccounts(); // 💡 Acceso rápido a la caché de cuentas

  // 💡 Resolvemos el ID de cuenta de la misma forma flexible
  const urlAccountId = searchParams.get('accountId') || (accounts[0]?.id) || '';

  const filterType = filters.type || '';
  const filterCategoryId = filters.categoryId || '';
  const filterStartDate = filters.startDate || '';
  const filterEndDate = filters.endDate || '';

  return useQuery({
    queryKey: ['transactions', urlAccountId, filterType, filterCategoryId, filterStartDate, filterEndDate, page],
    queryFn: async () => {
      const activeFilters = {
        ...(filters.type && { type: filters.type }), 
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      return await getTransactions({
        page: page, 
        pageSize: 10, 
        accountId: urlAccountId || undefined, 
        filters: activeFilters 
      });
    },
    placeholderData: keepPreviousData, 
    networkMode: 'offlineFirst',
    // Se habilita si hay un ID en la URL o si ya pudimos rescatar una cuenta por defecto de la caché
    enabled: !!urlAccountId, 
    retry: (failureCount) => {
      if (typeof window !== 'undefined' && !navigator.onLine) return false;
      return failureCount < 2;
    }
  });
}

// 💡 HOOK PARA LEER EL PERFIL
export function useProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      return await getProfile();
    },
    staleTime: 1000 * 60 * 15, 
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst',
  });
}

// Hook para actualizar el perfil
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileUpdateInput) => {
      const response = await updateProfile(data);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['user-profile'], response.data);
    },
  });
}

// ============================================================================
// 🚀 HOOKS CON INTERRUPCIÓN DE RED OFFLINE
// ============================================================================

export function useSaveTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      // 💡 Si el usuario está offline, podemos optar por guardar localmente o alertarle,
      // evitando rebotar peticiones rotas al backend.
      if (isOffline()) {
        throw new Error("Estás offline. Los cambios de transacciones se sincronizarán al recuperar la conexión.");
      }
      const response = await saveTransaction(payload);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    
    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const previousState = queryClient.getQueriesData({ queryKey: ['transactions'] });

      queryClient.setQueriesData({ queryKey: ['transactions'] }, (old: any) => {
        if (!old || !old.transactions) return old;

        const optimisticTx = {
          ...newTx,
          id: newTx.id || `temp-id-${Date.now()}`,
          status: 'pending', 
        };

        const updatedTransactions = newTx.id
          ? old.transactions.map((tx: any) => tx.id === newTx.id ? { ...tx, ...optimisticTx } : tx)
          : [optimisticTx, ...old.transactions];

        return {
          ...old,
          transactions: updatedTransactions,
          total: old.total + (newTx.id ? 0 : 1)
        };
      });

      return { previousState };
    },

    onError: (err, newTx, context) => {
      if (context?.previousState) {
        context.previousState.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Error al guardar: ${err.message}`);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },

    onSuccess: () => {
      toast.success('Transacción registrada con éxito');
    }
  });
}

// 🗑️ HOOK PARA ELIMINAR TRANSACCIONES
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOffline()) {
        throw new Error("No puedes eliminar transacciones en modo offline.");
      }
      const response = await deleteTransaction(id);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const previousState = queryClient.getQueriesData({ queryKey: ['transactions'] });

      queryClient.setQueriesData({ queryKey: ['transactions'] }, (old: any) => {
        if (!old || !old.transactions) return old;

        return {
          ...old,
          transactions: old.transactions.filter((tx: any) => tx.id !== deletedId),
          total: Math.max(0, old.total - 1)
        };
      });

      return { previousState };
    },

    onError: (err, deletedId, context) => {
      if (context?.previousState) {
        context.previousState.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Error al eliminar: ${err.message}`);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },

    onSuccess: () => {
      toast.success('Transacción eliminada permanentemente');
    }
  });
}

export function useUpdateSubTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, input }: { itemId: string, input: any }) => {
      const response = await updateSubTransaction(itemId, input);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      toast.success('Ítem actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error) => {
      toast.error(`Error al actualizar el ítem: ${error.message}`);
    }
  });
}

// 🏦 HOOK PARA CREAR/EDITAR CUENTAS
export function useSaveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const response = payload.id 
        ? await updateAccount(payload.id, payload)
        : await createAccount(payload);
        
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Nodo guardado con éxito');
    }
  });
}

export function useSaveTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await createTag(name);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['tags'], (old: any) => {
        return old ? [...old, response.data] : [response.data];
      });
      toast.success('Etiqueta creada');
    }
  });
}