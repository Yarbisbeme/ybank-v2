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
        // 🛡️ ESCUDO 1: Si no hay ID válido (está cargando o es null), abortamos en silencio
        if (!institutionId || typeof institutionId !== 'string') {
          return;
        }

        set({ isCalculatingRate: true }); 
        
        try {
          const rateData = await getSmartRate(institutionId, 'sell'); 
          
          // 🛡️ ESCUDO 2: Solo actualizamos si el servidor nos devolvió algo válido
          if (rateData) {
             set({ preferredRate: rateData });
          }
        } catch (error) {
          console.warn("⚠️ No se pudo sincronizar la Tasa YBANK (Posible transición de Auth).");
        } finally {
          set({ isCalculatingRate: false }); 
        }
      },
    }),
    {
      name: 'ybank-zustand-storage', 
      partialize: (state) => ({ 
        currency: state.currency, 
        preferredAccountId: state.preferredAccountId 
      }),
    }
  )
);