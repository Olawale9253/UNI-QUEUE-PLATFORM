import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
})

// Endpoints that should NEVER trigger an auto-logout/refresh on 401/400
const PUBLIC_AUTH_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
    '/api/auth/universities',
    '/api/auth/verify-email',         // 🔧 ADDED
    '/api/auth/resend-verification',  // 🔧 ADDED
]

let refreshPromise = null

function doRefresh() {
    if (refreshPromise) return refreshPromise

    const refreshToken = localStorage.getItem('uniqueue_refresh_token')
    if (!refreshToken) return Promise.reject(new Error('No refresh token'))

    refreshPromise = axios
        .post(
            (import.meta.env.VITE_API_URL || '') + '/api/auth/refresh',
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
        )
        .then(async (res) => {
            const dataValue = res.data?.data
            if (!dataValue?.accessToken) throw new Error('Refresh failed')

            localStorage.setItem('uniqueue_token', dataValue.accessToken)
            if (dataValue.refreshToken) {
                localStorage.setItem('uniqueue_refresh_token', dataValue.refreshToken)
            }

            try {
                const mod = await import('../store/authStore')
                mod.useAuthStore.getState().updateTokens(
                    dataValue.accessToken,
                    dataValue.refreshToken
                )
            } catch (e) {
                console.debug('[refresh] could not sync auth store:', e?.message)
            }

            return dataValue.accessToken
        })
        .finally(() => {
            refreshPromise = null
        })

    return refreshPromise
}

function clearAuthAndRedirect() {
    localStorage.removeItem('uniqueue_token')
    localStorage.removeItem('uniqueue_refresh_token')
    localStorage.removeItem('uniqueue_user')
    if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
    }
}

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('uniqueue_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (item) => item,
    async (error) => {
        const status = error.response?.status
        const original = error.config || {}
        const url = original.url || ''
        const isPublicPath = PUBLIC_AUTH_PATHS.some((itemValue) => url.includes(itemValue))

        // 1. Handle Offline / Network Errors
        if (!error.response) {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                error.friendlyMessage = 'No internet connection. Please check your network.'
            } else {
                error.friendlyMessage = 'Cannot reach the server. Please try again later.'
            }
            error.message = error.friendlyMessage
            return Promise.reject(error)
        }

        // 2. Handle HTTP Errors (400, 403, 404, etc.)
        // Extract the backend message so components can just use err.message
        const backendMessage = error.response.data?.message
        if (backendMessage) {
            error.message = backendMessage
        } else if (status >= 500) {
            error.message = 'Server error. Please try again later.'
        }

        // 🔧 FIX: Only try to refresh on 401 Unauthorized, and NOT on public paths
        if (status !== 401 || isPublicPath) {
            return Promise.reject(error)
        }

        if (original._retried) {
            clearAuthAndRedirect()
            return Promise.reject(error)
        }

        try {
            const newToken = await doRefresh()
            original._retried = true
            original.headers = original.headers || {}
            original.headers.Authorization = `Bearer ${newToken}`
            return api(original)
        } catch (refreshErr) {
            clearAuthAndRedirect()
            return Promise.reject(error)
        }
    }
)

export default api