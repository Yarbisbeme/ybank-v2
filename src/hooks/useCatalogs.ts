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
import { formatCurrency } from '@/lib/utils';
import { useYBankStore } from '@/store/useYBankStore';

const isOffline = () => typeof window !== 'undefined' && !navigator.onLine;

export const sanitizeDate = (rawDate: string | Date | null | undefined): string => {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  
  if (typeof rawDate === 'string') {
    return rawDate.split('T')[0].split(' ')[0]; 
  }
  
  // Si llega un objeto Date nativo
  const year = rawDate.getFullYear();
  const month = String(rawDate.getMonth() + 1).padStart(2, '0');
  const day = String(rawDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 🏦 1. Hook para Instituciones (Bancos)
export function useInstitutions() {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: async () => await getInstitutions(),
    staleTime: 24 * 60 * 60 * 1000, 
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst',
    enabled: typeof window !== 'undefined'
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
    enabled: typeof window !== 'undefined'
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
    enabled: typeof window !== 'undefined'
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
    enabled: typeof window !== 'undefined',
    placeholderData: keepPreviousData, 
  });
}

// 💳 5. Hook para Transacciones (Con Escudo Protector de Aplanamiento)
export function useTransactionsList(page: number = 1) {
  const filters = useFilterStore();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const rawAccountId = searchParams.get('accountId');
  const queryAccountId = (!rawAccountId || rawAccountId === 'global') ? null : rawAccountId;

  const filterType = filters.type || '';
  const filterCategoryId = filters.categoryId || '';
  const filterStartDate = filters.startDate || '';
  const filterEndDate = filters.endDate || '';
  const filterTagId = filters.tagId || '';    
  const filterSearch = filters.search || '';  

  return useQuery({
    queryKey: ['transactions', queryAccountId, filterType, filterCategoryId, filterStartDate, filterEndDate, filterTagId, filterSearch, page],
    queryFn: async () => {
      
      // 🛑 MODO OFFLINE
      if (typeof window !== 'undefined' && !navigator.onLine) {
        const baseKey = ['transactions', queryAccountId, '', '', '', '', '', '', 1];
        const cachedBaseData: any = queryClient.getQueryData(baseKey);
        if (!cachedBaseData || !cachedBaseData.transactions) return { transactions: [], total: 0 };
        return { transactions: cachedBaseData.transactions, total: cachedBaseData.transactions.length };
      }

      // 🟢 MODO ONLINE
      const activeFilters = {
        ...(filters.type && { type: filters.type }), 
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.tagId && { tagId: filters.tagId }), 
        ...(filters.search && { search: filters.search }),
      };

      const response = await getTransactions({
        page: page, 
        pageSize: 10, 
        accountId: queryAccountId || undefined, 
        filters: activeFilters 
      });

      if (response && response.transactions) {
        response.transactions = response.transactions.map((tx: any) => {
          
          // 🛡️ ESCUDO PROTECTOR: Si el servidor ya aplanó esto (ej. DGII de $1.50), lo pasamos intacto.
          if (tx.is_split_child) {
            return {
              ...tx,
              date: sanitizeDate(tx.date)
              // No tocamos 'amount' ni 'type', respetamos la orden del servidor.
            };
          }

          // 🔄 LÓGICA NORMAL PARA TRANSACCIONES RAÍZ
          let morphedType = tx.type;
          let finalAmount = tx.amount;
          
          if (queryAccountId && tx.type === 'transfer') {
            if (tx.transfer_to_account_id === queryAccountId) {
              morphedType = 'income';
              finalAmount = tx.target_amount || tx.amount;
            } else if (tx.account_id === queryAccountId) {
              morphedType = 'expense';
            }
          }

          return {
            ...tx,
            type: morphedType,
            original_type: tx.type,
            amount: finalAmount,
            date: sanitizeDate(tx.date)
          };
        });
      }

      return response;
    },
    placeholderData: keepPreviousData, 
    networkMode: 'offlineFirst',
  });
}

// 💡 HOOK PARA LEER EL PERFIL
export function useProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => await getProfile(),
    staleTime: 1000 * 60 * 15, 
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst',
    enabled: typeof window !== 'undefined'
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
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
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
      if (isOffline()) {
        throw new Error("Estás offline. Los cambios de transacciones se sincronizarán al recuperar la conexión.");
      }

      // 💡 INTERCEPTOR DE ESCRITURA (POST/PUT): Limpiamos la fecha antes de enviarla
      const safePayload = {
        ...payload,
        date: sanitizeDate(payload.date)
      };

      const response = await saveTransaction(safePayload);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    
    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const previousState = queryClient.getQueriesData({ queryKey: ['transactions'] });

      queryClient.setQueriesData({ queryKey: ['transactions'] }, (old: any) => {
        if (!old || !old.transactions) return old;

        // 💡 OPTIMISTIC UPDATE: Aseguramos que la UI instantánea tampoco cambie de día
        const optimisticTx = {
          ...newTx,
          date: sanitizeDate(newTx.date),
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

export function useGlobalSearch(searchQuery: string) {
  return useQuery({
    queryKey: ['global-search', searchQuery],
    queryFn: async () => {
      return await getTransactions({
        page: 1,
        pageSize: 5, // Solo necesitamos un preview de 5 ítems para el modal
        filters: { search: searchQuery } 
      });
    },
    enabled: searchQuery.trim().length > 2 && typeof window !== 'undefined' && navigator.onLine,
    staleTime: 1000 * 60 * 2, // Caché de 2 minutos
  });
}

export function useCurrency() {
  const { currency, preferredRate } = useYBankStore();

  const formatMoney = (amount: number, sourceCurrency: string) => {
    if (sourceCurrency === currency) {
      return formatCurrency(amount, currency);
    }

    const rate = preferredRate?.rate || 1;
    let convertedAmount = amount;

    if (currency === 'USD' && sourceCurrency === 'DOP') {
      convertedAmount = amount / rate;
    } else if (currency === 'DOP' && sourceCurrency === 'USD') {
      convertedAmount = amount * rate;
    }

    return formatCurrency(convertedAmount, currency);
  };

  return { currency, formatMoney };
}