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
    '/api/auth/universities',
]

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('uniqueue_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (r) => r,
    (error) => {
        const status = error.response?.status
        const url = error.config?.url || ''

        // Only bounce to /login on 401 for non-public endpoints
        const isPublicPath = PUBLIC_AUTH_PATHS.some((p) => url.includes(p))

        if (status === 401 && !isPublicPath) {
            localStorage.removeItem('uniqueue_token')
            localStorage.removeItem('uniqueue_user')
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api