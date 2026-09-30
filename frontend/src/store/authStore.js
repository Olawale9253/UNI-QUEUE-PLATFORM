import { create } from 'zustand'
import api from '../api/axios'
import { useUniversityStore } from './universityStore'

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

            // ⬇️ KEY FIX: wipe the previous user's university BEFORE
            // updating auth state, so the Navbar effect sees loaded=false
            // and reloads the new user's university.
            useUniversityStore.getState().reset()

            set({ token: d.accessToken, user, loading: false })

            // Kick off the reload immediately (don't wait for Navbar effect)
            if (d.role !== 'SUPER_ADMIN') {
                useUniversityStore.getState().load()
            }

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

            useUniversityStore.getState().reset()
            set({ token: d.accessToken, user, loading: false })

            if (d.role !== 'SUPER_ADMIN') {
                useUniversityStore.getState().load()
            }

            return {
                success: true,
                role: d.role,
                devVerificationCode: d.devVerificationCode,
                isVerified: d.isVerified,
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed'
            set({ loading: false, error: message })
            return { success: false, error: message }
        }
    },

    setAuth: (token, user) => {
        localStorage.setItem('uniqueue_token', token)
        localStorage.setItem('uniqueue_user', JSON.stringify(user))

        // ⬇️ Also reset university when impersonating (or switching accounts)
        useUniversityStore.getState().reset()

        set({ token, user })

        if (user?.role && user.role !== 'SUPER_ADMIN') {
            useUniversityStore.getState().load()
        }
    },

    setUser: (patch) => {
        const current = get().user || {}
        const next = { ...current, ...(patch || {}) }
        localStorage.setItem('uniqueue_user', JSON.stringify(next))
        set({ user: next })
    },

    refreshProfile: async () => {
        try {
            const res = await api.get('/api/profile')
            const p = res.data?.data
            if (!p) return { success: false }

            const current = get().user || {}
            const next = {
                ...current,
                userId: p.id ?? current.userId,
                email: p.email ?? current.email,
                fullName: p.fullName ?? current.fullName,
                role: p.role ?? current.role,
                universityId: p.universityId ?? current.universityId,
            }

            localStorage.setItem('uniqueue_user', JSON.stringify(next))
            set({ user: next })
            return { success: true, profile: p }
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.message || 'Failed to refresh profile',
            }
        }
    },

    logout: () => {
        localStorage.removeItem('uniqueue_token')
        localStorage.removeItem('uniqueue_user')
        localStorage.removeItem('uniqueue_impersonation')


        useUniversityStore.getState().reset()

        set({ user: null, token: null })
    },

    clearError: () => set({ error: null }),
}))