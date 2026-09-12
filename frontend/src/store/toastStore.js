import { create } from 'zustand'

export const useToastStore = create((set, get) => ({
    toasts: [],
    push: (toast) => {
        const id = Date.now() + Math.random()
        set({ toasts: [...get().toasts, { id, type: 'info', duration: 4000, ...toast }] })
        setTimeout(() => get().dismiss(id), toast.duration || 4000)
    },
    dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))