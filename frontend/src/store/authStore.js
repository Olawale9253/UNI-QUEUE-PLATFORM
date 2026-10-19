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

/** Turn an axios error into a structured result. */
function describeError(err, fallback) {
    const status = err?.response?.status
    const body = err?.response?.data
    const message = body?.message || fallback

    if (status === 429) {
        const fromBody = body?.data?.retryAfterSeconds
        const fromHeader = parseInt(err?.response?.headers?.['retry-after'], 10)
        const retryAfter =
            Number.isFinite(fromBody) ? fromBody :
                Number.isFinite(fromHeader) ? fromHeader :
                    null

        return {
            success: false,
            error: message,
            rateLimited: true,
            retryAfter,
        }
    }

    return { success: false, error: message }
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

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (item) => {
        if (item.key === TOKEN_KEY && item.newValue === null) {
            useUniversityStore.getState().reset()
            usePrefsStore.getState().reset()
            useAuthStore.setState({ user: null, token: null })
            if (!window.location.pathname.startsWith('/login')) {
                window.location.replace('/login')
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
            const userData = res.data.data
            const user = {
                userId: userData.userId,
                email: userData.email,
                fullName: userData.fullName,
                role: userData.role,
                universityId: userData.universityId,
            }
            persistSession(userData.accessToken, userData.refreshToken, user)

            useUniversityStore.getState().reset()
            usePrefsStore.getState().reset()
            set({ token: userData.accessToken, user, loading: false })

            if (userData.role !== 'SUPER_ADMIN') {
                useUniversityStore.getState().load()
            }

            usePrefsStore.getState().load()
            syncExistingPushSubscription()

            return { success: true, role: userData.role }
        } catch (err) {
            const result = describeError(err, 'Login failed')
            set({ loading: false, error: result.error })
            return result
        }
    },

    register: async (payload) => {
        set({ loading: true, error: null })
        try {
            const res = await api.post('/api/auth/register', payload)
            const userData = res.data.data
            const user = {
                userId: userData.userId,
                email: userData.email,
                fullName: userData.fullName,
                role: userData.role,
                universityId: userData.universityId,
            }
            persistSession(userData.accessToken, userData.refreshToken, user)

            useUniversityStore.getState().reset()
            usePrefsStore.getState().reset()
            set({ token: userData.accessToken, user, loading: false })

            if (userData.role !== 'SUPER_ADMIN') {
                useUniversityStore.getState().load()
            }

            usePrefsStore.getState().load()
            syncExistingPushSubscription()

            return {
                success: true,
                role: userData.role,
                devVerificationCode: userData.devVerificationCode,
                isVerified: userData.isVerified,
                registrationStatus: userData.registrationStatus,
            }
        } catch (err) {
            const result = describeError(err, 'Registration failed')
            set({ loading: false, error: result.error })
            return result
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
            const profileData = res.data?.data
            if (!profileData) return { success: false }

            const current = get().user || {}
            const next = {
                ...current,
                userId: profileData.id ?? current.userId,
                email: profileData.email ?? current.email,
                fullName: profileData.fullName ?? current.fullName,
                role: profileData.role ?? current.role,
                universityId: profileData.universityId ?? current.universityId,
            }

            localStorage.setItem(USER_KEY, JSON.stringify(next))
            set({ user: next })
            return { success: true, profile: profileData }
        } catch (err) {
            return {
                success: false,
                error: err.message || 'Failed to refresh profile',
            }
        }
    },

    logout: () => {
        clearSession()
        useUniversityStore.getState().reset()
        usePrefsStore.getState().reset()
        set({ user: null, token: null })

        // Force a hard reload to the login page.
        // This wipes the React memory and replaces the history entry.
        window.location.replace('/login')
    },

    clearError: () => set({ error: null }),
}))