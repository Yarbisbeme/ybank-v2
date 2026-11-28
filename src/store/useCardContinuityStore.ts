import { create } from 'zustand';

/**
 * Which card takes part in the Inicio ↔ Cuentas card transition (SharedCard).
 *
 * - openingAccountId: the card the user just tapped on Inicio to open it. Only
 *   that card is named on Inicio, so arriving at Cuentas from the menu or search
 *   does not make a card fly.
 * - focusedAccountId: the card in hand in Cuentas. On the way back, Inicio starts
 *   on it and names it, so it returns to its place however the user leaves.
 */
interface CardContinuityState {
  openingAccountId: string | null;
  focusedAccountId: string | null;
  markOpening: (accountId: string) => void;
  clearOpening: () => void;
  setFocused: (accountId: string | null) => void;
}

export const useCardContinuityStore = create<CardContinuityState>((set) => ({
  openingAccountId: null,
  focusedAccountId: null,
  markOpening: (accountId) => set({ openingAccountId: accountId }),
  clearOpening: () => set({ openingAccountId: null }),
  setFocused: (accountId) => set({ focusedAccountId: accountId }),
}));
