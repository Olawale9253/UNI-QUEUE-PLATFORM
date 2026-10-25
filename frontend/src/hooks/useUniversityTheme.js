import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useUniversityStore } from '../store/universityStore'
import { useAuthStore } from '../store/authStore'
import { generatePalette, normalizeBrandHex, DEFAULT_BRAND } from '../lib/colors'

const PUBLIC_ROUTES = [
    '/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/for-universities'
]

export function useUniversityTheme() {
    const university = useUniversityStore((item) => item.university)
    const user = useAuthStore((state) => state.user)
    const location = useLocation()

    useEffect(() => {
        const root = document.documentElement
        const isPublicPage = PUBLIC_ROUTES.includes(location.pathname)

        // 🔧 Fix: Ignore school colors on Public pages AND for Super Admins
        const isSuperAdmin = user?.role === 'SUPER_ADMIN'
        const raw = (isPublicPage || isSuperAdmin) ? null : university?.primaryColor

        const effective = normalizeBrandHex(raw) || DEFAULT_BRAND
        const palette = generatePalette(effective)

        Object.entries(palette).forEach(([shade, hex]) => {
            root.style.setProperty(`--color-brand-${shade}`, hex)
        })

        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) meta.setAttribute('content', palette[600])
    }, [university?.primaryColor, location.pathname, user?.role])
}