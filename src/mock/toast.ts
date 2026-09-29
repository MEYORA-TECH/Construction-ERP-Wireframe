import { create } from 'zustand';

export type ToastKind = 'success' | 'info' | 'error';
export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  text?: string;
}

interface ToastState {
  toasts: Toast[];
  push(t: Omit<Toast, 'id'>): void;
  dismiss(id: number): void;
}

let seq = 1;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push(t) {
    const id = seq++;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3200);
  },
  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
  },
}));

export const toast = {
  success: (title: string, text?: string) => useToasts.getState().push({ kind: 'success', title, text }),
  info: (title: string, text?: string) => useToasts.getState().push({ kind: 'info', title, text }),
  error: (title: string, text?: string) => useToasts.getState().push({ kind: 'error', title, text }),
};
