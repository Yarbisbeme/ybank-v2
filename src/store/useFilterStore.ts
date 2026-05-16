import { create } from 'zustand';

// 💡 1. Definimos los tipos exactos de nuestros filtros
export type FilterTransactionType = 'expense' | 'income' | 'transfer' | null;

interface FilterState {
  // --- VARIABLES DE ESTADO ---
  accountId: string | null;
  categoryId: string | null;
  tagId: string | null;
  type: FilterTransactionType;
  startDate: string | null;
  endDate: string | null;

  // --- ACCIONES (MUTADORES) ---
  // Cambia un solo filtro a la vez (ej. solo cambiar la fecha)
  setFilter: <K extends keyof Omit<FilterState, 'setFilter' | 'setFilters' | 'clearFilters'>>(
    key: K, 
    value: FilterState[K]
  ) => void;
  
  // Cambia varios filtros de golpe (ej. resetear cuenta y tipo)
  setFilters: (filters: Partial<Omit<FilterState, 'setFilter' | 'setFilters' | 'clearFilters'>>) => void;
  
  // Limpia todos los filtros devolviéndolos a su estado original
  clearFilters: () => void;
}

// Estado inicial limpio
const initialState = {
  accountId: null,
  categoryId: null,
  tagId: null,
  type: null as FilterTransactionType,
  startDate: null,
  endDate: null,
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