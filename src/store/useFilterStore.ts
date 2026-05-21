import { create } from 'zustand';

export type FilterTransactionType = 'expense' | 'income' | 'transfer' | null;

interface FilterState {
  accountId: string | null;
  categoryId: string | null;
  tagId: string | null;
  type: FilterTransactionType;
  startDate: string | null;
  endDate: string | null;
  search: string | null; // 💡 NUEVO: Estado global para búsquedas por texto libre

  setFilter: <K extends keyof Omit<FilterState, 'setFilter' | 'setFilters' | 'clearFilters'>>(
    key: K, 
    value: FilterState[K]
  ) => void;
  
  setFilters: (filters: Partial<Omit<FilterState, 'setFilter' | 'setFilters' | 'clearFilters'>>) => void;
  
  clearFilters: () => void;
}

const initialState = {
  accountId: null,
  categoryId: null,
  tagId: null,
  type: null as FilterTransactionType,
  startDate: null,
  endDate: null,
  search: null,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  
  setFilter: (key, value) => 
    set((state) => ({ ...state, [key]: value })),
    
  setFilters: (filters) => 
    set((state) => ({ ...state, ...filters })),
    
  clearFilters: () => 
    set(initialState),
}));