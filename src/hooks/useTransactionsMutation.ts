import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveTransaction, deleteTransaction } from '@/lib/actions/transactions';

export function useSaveTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await saveTransaction(payload);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    
    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      const previousState = queryClient.getQueryData(['transactions']);

      queryClient.setQueryData(['transactions'], (old: any) => {
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
        queryClient.setQueryData(['transactions'], context.previousState);
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