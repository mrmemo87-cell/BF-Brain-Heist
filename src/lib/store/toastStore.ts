
import { create } from 'zustand';
import type { ToastMessage } from '@/lib/types';

type ToastStore = {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: number) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: Date.now() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Hook for easy toast adding
export const useToasts = () => {
    const addToast = useToastStore((state) => state.addToast);

    return {
        showSuccess: (title: string, description?: string) => addToast({ title, description, type: 'success' }),
        showError: (title: string, description?: string) => addToast({ title, description, type: 'error' }),
        showInfo: (title: string, description?: string) => addToast({ title, description, type: 'info' }),
    };
}

