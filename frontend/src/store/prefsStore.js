import { create } from 'zustand'
import api from '../api/axios'

const DEFAULT_PREFS = {
    soundEnabled: true,
    pushEnabled: true,
    ticketEmailsEnabled: true,
}

export const usePrefsStore = create((set, get) => ({
    prefs: DEFAULT_PREFS,
    loaded: false,
    loading: false,

    load: async () => {
        set({ loading: true })
        try {
            const res = await api.get('/api/me/prefs')
            set({
                prefs: { ...DEFAULT_PREFS, ...(res.data?.data || {}) },
                loaded: true,
                loading: false,
            })
        } catch {
            set({ loaded: true, loading: false })
        }
    },

    update: async (patch) => {
        const prev = get().prefs
        set({ prefs: { ...prev, ...patch } })
        try {
            const res = await api.patch('/api/me/prefs', patch)
            set({ prefs: { ...DEFAULT_PREFS, ...(res.data?.data || {}) } })
            return { success: true }
        } catch (err) {
            set({ prefs: prev })
            return {
                success: false,
                error: err.message || 'Failed to save preferences',
            }
        }
    },

    reset: () => set({ prefs: DEFAULT_PREFS, loaded: false, loading: false }),
}))