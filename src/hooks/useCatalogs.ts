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
export function useTransactionsList(page: number = 1) {
  const filters = useFilterStore();
  const searchParams = useSearchParams();
  
  const urlAccountId = searchParams.get('accountId');

  return useQuery({
    queryKey: ['transactions', urlAccountId, filters.type, filters.categoryId, filters.startDate, filters.endDate, page],
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
  });
}

// Hook para actualizar el perfil
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileUpdateInput) => {
      const response = await updateProfile(data);
      if (!response.success) throw new Error(response.error);
      return response; // 💡 Ahora esto incluye response.data
    },
    onSuccess: (response) => {
      // 💡 En vez de invalidar y gastar internet, inyectamos la data nueva directamente
      queryClient.setQueryData(['user-profile'], response.data);
    },
  });
}

// ============================================================================
// 🚀 NUEVOS HOOKS OPTIMISTAS (FASE 2)
// ============================================================================

export function useSaveTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await saveTransaction(payload);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    
    onMutate: async (newTx) => {
      // 1. Cancelamos peticiones en vuelo
      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      // 2. Tomamos una "foto" de TODAS las cachés de transacciones (todas las páginas)
      const previousState = queryClient.getQueriesData({ queryKey: ['transactions'] });

      // 3. Modificamos los datos en pantalla instantáneamente usando setQueriesData (plural)
      queryClient.setQueriesData({ queryKey: ['transactions'] }, (old: any) => {
        if (!old || !old.transactions) return old;

        const optimisticTx = {
          ...newTx,
          id: newTx.id || `temp-id-${Date.now()}`,
          status: 'pending', // Para darle un feedback visual si quieres
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
      // Si falla, restauramos la foto anterior
      if (context?.previousState) {
        context.previousState.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Error al guardar: ${err.message}`);
    },

    onSettled: () => {
      // Sincronizamos silenciosamente con la base de datos real
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      // Invalidamos las cuentas para que el Dashboard actualice los balances
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

// 🏦 HOOK PARA CREAR/EDITAR CUENTAS (Añadir al final)
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
      // 💡 Inyectamos el nuevo tag en la lista existente sin recargar
      queryClient.setQueryData(['tags'], (old: any) => {
        return old ? [...old, response.data] : [response.data];
      });
      toast.success('Etiqueta creada');
    }
  });
}