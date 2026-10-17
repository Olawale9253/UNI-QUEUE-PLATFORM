import { create } from 'zustand'
import api from '../api/axios'

// Helper to load cached university from local storage instantly on reload
const getSavedUniversity = () => {
    try {
        const saved = localStorage.getItem('uniqueue_university')
        return saved ? JSON.parse(saved) : null
    } catch {
        return null
    }
}

export const useUniversityStore = create((set, get) => ({
    university: getSavedUniversity(),
    loading: false,
    loaded: !!getSavedUniversity(), // If we have it cached, consider it loaded

    load: async () => {
        if (get().loading) return
        set({ loading: true })
        try {
            const res = await api.get('/api/profile')
            const parameter = res.data.data
            const newUniversity = parameter.universityId
                ? {
                    id: parameter.universityId,
                    name: parameter.universityName,
                    code: parameter.universityCode,
                    logoUrl: parameter.universityLogoUrl,
                    primaryColor: parameter.universityPrimaryColor,
                }
                : null

            set({
                university: newUniversity,
                loading: false,
                loaded: true,
            })

            // Cache for instant load next time
            if (newUniversity) {
                localStorage.setItem('uniqueue_university', JSON.stringify(newUniversity))
            } else {
                localStorage.removeItem('uniqueue_university')
            }
        } catch {
            set({ loading: false, loaded: true })
        }
    },

    refresh: () => set({ loaded: false }),
    reset: () => {
        localStorage.removeItem('uniqueue_university')
        set({ university: null, loaded: false })
    },
}))