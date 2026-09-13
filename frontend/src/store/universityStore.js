import { create } from 'zustand'
import api from '../api/axios'

export const useUniversityStore = create((set, get) => ({
    university: null, // { id, name, code, logoUrl, primaryColor }
    loading: false,
    loaded: false,

    load: async () => {
        if (get().loading) return
        set({ loading: true })
        try {
            const res = await api.get('/api/profile')
            const p = res.data.data
            set({
                university: p.universityId
                    ? {
                        id: p.universityId,
                        name: p.universityName,
                        code: p.universityCode,
                        logoUrl: p.universityLogoUrl,
                        primaryColor: p.universityPrimaryColor,
                    }
                    : null,
                loading: false,
                loaded: true,
            })
        } catch {
            set({ loading: false, loaded: true })
        }
    },

    refresh: () => set({ loaded: false }),
    reset: () => set({ university: null, loaded: false }),
}))