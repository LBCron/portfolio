import { create } from 'zustand';

export interface ToastItem {
  id: number;
  message: string;
  tone: 'error' | 'neutral' | 'success';
}

interface ToastState {
  dismiss: (id: number) => void;
  push: (message: string, tone?: ToastItem['tone']) => void;
  toasts: ToastItem[];
}

const TOAST_DURATION_MS = 4000;
let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message, tone = 'neutral') => {
    const id = nextId++;

    set({ toasts: [...get().toasts.slice(-2), { id, message, tone }] });
    window.setTimeout(() => get().dismiss(id), TOAST_DURATION_MS);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function toast(message: string, tone?: ToastItem['tone']): void {
  useToastStore.getState().push(message, tone);
}
