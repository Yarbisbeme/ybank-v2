import { ModalState } from '@/types';
import { create } from 'zustand'

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: null as any, // (Dependiendo de cómo tengas ModalType, a veces requiere null as any o cast si no admite null explícitamente)
  payload: null,
  
  openModal: (type, payload = null) => set({ isOpen: true, type, payload }),
  closeModal: () => set({ isOpen: false, type: null as any, payload: null }),
}));