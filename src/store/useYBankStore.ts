// store/useYBankStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSmartRate } from '@/services/rates'; 
import { YBankStore } from '@/types';

export const useYBankStore = create<YBankStore>()(
  persist(
    (set) => ({
      currency: 'DOP',
      preferredAccountId: null,
      preferredRate: null,
      isCalculatingRate: false,

      setCurrency: (currency) => set({ currency }),

      updateRateContext: async (institutionId: string) => {
        set({ isCalculatingRate: true }); 
        try {
          const rateData = await getSmartRate(institutionId, 'sell'); 
          set({ preferredRate: rateData });
        } catch (error) {
          console.error("Error al sincronizar Tasa YBANK:", error);
        } finally {
          set({ isCalculatingRate: false }); 
        }
      },
    }),
    {
      name: 'ybank-zustand-storage', // Guarda la moneda y la cuenta en localStorage
      // No persistimos la tasa ni el estado de carga
      partialize: (state) => ({ 
        currency: state.currency, 
        preferredAccountId: state.preferredAccountId 
      }),
    }
  )
);