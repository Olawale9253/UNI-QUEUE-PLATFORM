import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useUniversityStore } from '../store/universityStore'
import { generatePalette, normalizeBrandHex, DEFAULT_BRAND } from '../lib/colors'

// These paths will always use the default blue theme
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/for-universities'
]

export function useUniversityTheme() {
    const university = useUniversityStore((item) => item.university)
    const location = useLocation()

    useEffect(() => {
        const root = document.documentElement

        // Check if we are on a public page
        const isPublicPage = PUBLIC_ROUTES.includes(location.pathname)

        // If it's a public page, ignore the university's primary color
        const raw = isPublicPage ? null : university?.primaryColor

        const effective = normalizeBrandHex(raw) || DEFAULT_BRAND
        const palette = generatePalette(effective)

        Object.entries(palette).forEach(([shade, hex]) => {
            root.style.setProperty(`--color-brand-${shade}`, hex)
        })

        // Also set the meta theme-color for mobile browser chrome
        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) meta.setAttribute('content', palette[600])
    }, [university?.primaryColor, location.pathname])
}