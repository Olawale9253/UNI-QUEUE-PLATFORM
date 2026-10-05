import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    headers: { 'Content-Type': 'application/json' },
})

// Endpoints that should NEVER trigger an auto-logout on 401
const PUBLIC_AUTH_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
    '/api/auth/universities',
]

// ─── Concurrency guard ───
// If three requests 401 at the same time, only one refresh call fires;
// the other two wait for its result and retry with the new token.
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
        .then((res) => {
            const d = res.data?.data
            if (!d?.accessToken) throw new Error('Refresh failed')

            localStorage.setItem('uniqueue_token', d.accessToken)
            if (d.refreshToken) {
                localStorage.setItem('uniqueue_refresh_token', d.refreshToken)
            }
            return d.accessToken
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
    (r) => r,
    async (error) => {
        const status = error.response?.status
        const original = error.config || {}
        const url = original.url || ''
        const isPublicPath = PUBLIC_AUTH_PATHS.some((p) => url.includes(p))

        if (status !== 401 || isPublicPath) {
            return Promise.reject(error)
        }

        // Don't try to refresh a refresh call itself.
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