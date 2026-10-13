import { create } from 'zustand'
import api from '../api/axios'
import { useUniversityStore } from './universityStore'
import { usePrefsStore } from './prefsStore'

const TOKEN_KEY = 'uniqueue_token'
const REFRESH_KEY = 'uniqueue_refresh_token'
const USER_KEY = 'uniqueue_user'

const savedUser = (() => {
    try {
        const raw = localStorage.getItem(USER_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
})()

function persistSession(accessToken, refreshToken, user) {
    localStorage.setItem(TOKEN_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('uniqueue_impersonation')
}

async function syncExistingPushSubscription() {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js')
        if (!reg) return

        const sub = await reg.pushManager.getSubscription()
        if (!sub) return

        const raw = sub.toJSON()
        await api.post('/api/push/subscribe', {
            endpoint: raw.endpoint,
            keys: raw.keys,
        })
        console.debug('[push] subscription synced for current user')
    } catch (err) {
        console.debug('[push] re-sync skipped:', err?.message)
    }
}

// ─── Cross-tab logout sync ───
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (item) => {
        if (item.key === TOKEN_KEY && item.newValue === null) {
            useUniversityStore.getState().reset()
            usePrefsStore.getState().reset()
            useAuthStore.setState({ user: null, token: null })
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login'
            }
        }
    })
}

export const useAuthStore = create((set, get) => ({
    user: savedUser,
    token: localStorage.getItem(TOKEN_KEY),
    loading: false,
    error: null,

    isAuthenticated: () => !!get().token && !!get().user,

    login: async (email, password) => {
        set({ loading: true, error: null })
        try {
            const res = await api.post('/api/auth/login', { email, password })
            const dateValue = res.data.data
            const user = {
                userId: dateValue.userId,
                email: dateValue.email,
                fullName: dateValue.fullName,
                role: dateValue.role,
                universityId: dateValue.universityId,
            }
            persistSession(dateValue.accessToken, dateValue.refreshToken, user)

            useUniversityStore.getState().reset()
            usePrefsStore.getState().reset()
            set({ token: dateValue.accessToken, user, loading: false })

            if (dateValue.role !== 'SUPER_ADMIN') {
                useUniversityStore.getState().load()
            }

            // Fresh prefs for the logged-in user
            usePrefsStore.getState().load()

            syncExistingPushSubscription()

            return { success: true, role: dateValue.role }
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
            const dateValue = res.data.data
            const user = {
                userId: dateValue.userId,
                email: dateValue.email,
                fullName: dateValue.fullName,
                role: dateValue.role,
                universityId: dateValue.universityId,
            }
            persistSession(dateValue.accessToken, dateValue.refreshToken, user)

            useUniversityStore.getState().reset()
            usePrefsStore.getState().reset()
            set({ token: dateValue.accessToken, user, loading: false })

            if (dateValue.role !== 'SUPER_ADMIN') {
                useUniversityStore.getState().load()
            }

            usePrefsStore.getState().load()

            syncExistingPushSubscription()

            return {
                success: true,
                role: dateValue.role,
                devVerificationCode: dateValue.devVerificationCode,
                isVerified: dateValue.isVerified,
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed'
            set({ loading: false, error: message })
            return { success: false, error: message }
        }
    },

    setAuth: (token, user, refreshToken = null) => {
        persistSession(token, refreshToken, user)

        useUniversityStore.getState().reset()
        usePrefsStore.getState().reset()
        set({ token, user })

        if (user?.role && user.role !== 'SUPER_ADMIN') {
            useUniversityStore.getState().load()
        }

        usePrefsStore.getState().load()
        syncExistingPushSubscription()
    },

    updateTokens: (accessToken, refreshToken) => {
        if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
        if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
        if (accessToken) set({ token: accessToken })
    },

    setUser: (patch) => {
        const current = get().user || {}
        const next = { ...current, ...(patch || {}) }
        localStorage.setItem(USER_KEY, JSON.stringify(next))
        set({ user: next })
    },

    refreshProfile: async () => {
        try {
            const res = await api.get('/api/profile')
            const parameter = res.data?.data
            if (!parameter) return { success: false }

            const current = get().user || {}
            const next = {
                ...current,
                userId: parameter.id ?? current.userId,
                email: parameter.email ?? current.email,
                fullName: parameter.fullName ?? current.fullName,
                role: parameter.role ?? current.role,
                universityId: parameter.universityId ?? current.universityId,
            }

            localStorage.setItem(USER_KEY, JSON.stringify(next))
            set({ user: next })
            return { success: true, profile: parameter }
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.message || 'Failed to refresh profile',
            }
        }
    },

    logout: () => {
        clearSession()
        useUniversityStore.getState().reset()
        usePrefsStore.getState().reset()
        set({ user: null, token: null })
    },

    clearError: () => set({ error: null }),
}))