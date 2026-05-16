// store/useSelectionStore.ts
import { create } from 'zustand';

interface SelectionState {
  isSelectionMode: boolean;
  selectedTx: Record<string, any>;
  totalItemsInView: number; // Para que la barra sepa cuántos items hay en total
  
  setIsSelectionMode: (val: boolean) => void;
  setSelectedTx: (txs: Record<string, any>) => void;
  toggleSingleTx: (tx: any) => void;
  clearSelection: () => void;
  setTotalItemsInView: (total: number) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  isSelectionMode: false,
  selectedTx: {},
  totalItemsInView: 0,
  
  setIsSelectionMode: (val) => set({ isSelectionMode: val }),
  setSelectedTx: (txs) => set({ selectedTx: txs }),
  
  toggleSingleTx: (tx) => set((state) => {
    const next = { ...state.selectedTx };
    if (next[tx.id]) delete next[tx.id]; 
    else next[tx.id] = tx;
    return { selectedTx: next };
  }),
  
  clearSelection: () => set({ selectedTx: {}, isSelectionMode: false }),
  setTotalItemsInView: (total) => set({ totalItemsInView: total }),
}));