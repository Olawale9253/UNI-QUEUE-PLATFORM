import { create } from 'zustand'
import api from '../api/axios'

const savedUser = (() => {
    try {
        const raw = localStorage.getItem('uniqueue_user')
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
})()

export const useAuthStore = create((set, get) => ({
    user: savedUser,
    token: localStorage.getItem('uniqueue_token'),
    loading: false,
    error: null,

    isAuthenticated: () => !!get().token && !!get().user,

    login: async (email, password) => {
        set({ loading: true, error: null })
        try {
            const res = await api.post('/api/auth/login', { email, password })
            const d = res.data.data
            const user = {
                userId: d.userId,
                email: d.email,
                fullName: d.fullName,
                role: d.role,
                universityId: d.universityId,
            }
            localStorage.setItem('uniqueue_token', d.accessToken)
            localStorage.setItem('uniqueue_user', JSON.stringify(user))
            set({ token: d.accessToken, user, loading: false })
            return { success: true, role: d.role }
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed'
            set({ loading: false, error: message })
            return { success: false, error: message }
        }
    },

    register: async (payload) => {
        set({ loading: true, error: null })
        try {
            const res = await api.post('/api/auth/register', payload)
            const d = res.data.data
            const user = {
                userId: d.userId,
                email: d.email,
                fullName: d.fullName,
                role: d.role,
                universityId: d.universityId,
            }
            localStorage.setItem('uniqueue_token', d.accessToken)
            localStorage.setItem('uniqueue_user', JSON.stringify(user))
            set({ token: d.accessToken, user, loading: false })
            return { success: true, role: d.role }
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed'
            set({ loading: false, error: message })
            return { success: false, error: message }
        }
    },

    logout: () => {
        localStorage.removeItem('uniqueue_token')
        localStorage.removeItem('uniqueue_user')
        set({ user: null, token: null })
    },

    clearError: () => set({ error: null }),
}))