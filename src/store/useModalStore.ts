import { ModalState } from '@/types';
import { create } from 'zustand'

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: null,
  payload: null,
  
  openModal: (type, payload = null) => set({ isOpen: true, type, payload }),
  closeModal: () => set({ isOpen: false, type: null as any, payload: null }),
}));