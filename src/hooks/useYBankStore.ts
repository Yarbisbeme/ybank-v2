import { create } from 'zustand';
import { getSmartRate } from '@/services/rates'; // Tu función actual
import { YBankStore } from '@/types';

export const useYBankStore = create<YBankStore>((set) => ({
  currency: 'DOP',
  preferredRate: null,

  setCurrency: (currency) => set({ currency }),

  updateRateContext: async (institutionId: string) => {
    const rateData = await getSmartRate(institutionId, 'sell'); 
    set({ preferredRate: rateData });

  },
}));