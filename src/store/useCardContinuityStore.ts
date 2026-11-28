import { create } from 'zustand';

/**
 * The card the user just tapped on Inicio to open it in Cuentas. Only that card
 * is named for the shared-element transition, so arriving at Cuentas any other
 * way (menu, search, back) does not make a card fly.
 */
interface CardContinuityState {
  openingAccountId: string | null;
  markOpening: (accountId: string) => void;
  clearOpening: () => void;
}

export const useCardContinuityStore = create<CardContinuityState>((set) => ({
  openingAccountId: null,
  markOpening: (accountId) => set({ openingAccountId: accountId }),
  clearOpening: () => set({ openingAccountId: null }),
}));
