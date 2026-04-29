import { create } from 'zustand';
import { getSmartRate } from '@/services/rates'; 
import { YBankStore } from '@/types';

export const useYBankStore = create<YBankStore>((set) => ({
  // 1. Estado Inicial
  currency: 'DOP',
  preferredAccountId: null,
  preferredRate: null,
  isCalculatingRate: false, // 💡 Empezamos asumiendo que no está calculando

  // 2. Acciones Simples
  setCurrency: (currency) => set({ currency }),

  // 3. Acciones Asíncronas (El motor de la Tasa Inteligente)
  updateRateContext: async (institutionId: string) => {
    set({ isCalculatingRate: true }); // ⏳ Encendemos el spinner del HeroBalance
    
    try {
      const rateData = await getSmartRate(institutionId, 'sell'); 
      set({ preferredRate: rateData });
    } catch (error) {
      console.error("Error al sincronizar Tasa YBANK:", error);
    } finally {
      set({ isCalculatingRate: false }); // 🛑 Apagamos el spinner pase lo que pase
    }
  },
}));