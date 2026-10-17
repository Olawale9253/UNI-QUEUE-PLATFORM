import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    // ⬅️ REMOVED: headers: { 'Content-Type': 'application/json' },
    // Axios will automatically set the correct Content-Type (JSON or FormData) per request.
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

let refreshPromise = null

function doRefresh() {
    if (refreshPromise) return refreshPromise

    const refreshToken = localStorage.getItem('uniqueue_refresh_token')
    if (!refreshToken) return Promise.reject(new Error('No refresh token'))

    refreshPromise = axios
        .post(
            (import.meta.env.VITE_API_URL || '') + '/api/auth/refresh',
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } } // Explicit here is fine
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