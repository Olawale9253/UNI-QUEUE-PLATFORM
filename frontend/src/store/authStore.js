import { create } from 'zustand'
import api from '../api/axios'
import { useUniversityStore } from './universityStore'

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

/**
 * If this browser already has a push subscription (from a previous session
 * or a different user), tell the backend it now belongs to the currently
 * logged-in user. Runs in the background — never blocks login.
 *
 * The browser subscription itself is per-device, not per-user, so this is
 * how we reassign ownership when different accounts log in on the same
 * device.
 */
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
        // Push is best-effort — never let it block or break login
        console.debug('[push] re-sync skipped:', err?.message)
    }
}

// ─── Cross-tab logout sync ───
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === TOKEN_KEY && e.newValue === null) {
            useUniversityStore.getState().reset()
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
            const d = res.data.data
            const user = {
                userId: d.userId,
                email: d.email,
                fullName: d.fullName,
                role: d.role,
                universityId: d.universityId,
            }
            persistSession(d.accessToken, d.refreshToken, user)

            useUniversityStore.getState().reset()
            set({ token: d.accessToken, user, loading: false })

            if (d.role !== 'SUPER_ADMIN') {
                useUniversityStore.getState().load()
            }

            // Reassign any existing push subscription on this device to this user.
            syncExistingPushSubscription()

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
            persistSession(d.accessToken, d.refreshToken, user)

            useUniversityStore.getState().reset()
            set({ token: d.accessToken, user, loading: false })

            if (d.role !== 'SUPER_ADMIN') {
                useUniversityStore.getState().load()
            }

            // A user registering on a device that already had a subscription
            // should also have it reassigned to them.
            syncExistingPushSubscription()

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

    setAuth: (token, user, refreshToken = null) => {
        persistSession(token, refreshToken, user)

        useUniversityStore.getState().reset()
        set({ token, user })

        if (user?.role && user.role !== 'SUPER_ADMIN') {
            useUniversityStore.getState().load()
        }

        // Used by impersonation. The impersonated user's device should also
        // receive their own pushes if the super admin had subscribed.
        syncExistingPushSubscription()
    },

    /**
     * Update tokens after a password change (backend returns fresh ones).
     */
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

            localStorage.setItem(USER_KEY, JSON.stringify(next))
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
        clearSession()
        useUniversityStore.getState().reset()
        set({ user: null, token: null })
        // The storage event will propagate the logout to other tabs automatically.
    },

    clearError: () => set({ error: null }),
}))