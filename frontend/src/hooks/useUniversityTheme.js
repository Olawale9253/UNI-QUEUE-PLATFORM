import { useEffect } from 'react'
import { useUniversityStore } from '../store/universityStore'
import { generatePalette, normalizeBrandHex, DEFAULT_BRAND } from '../lib/colors'

/**
 * Injects the university's primary color into Tailwind's `--color-brand-*`
 * CSS variables on <html>. Tailwind v4's classes (bg-brand-600, text-brand-500,
 * etc.) resolve to `var(--color-brand-600)`, so overriding the variable
 * re-themes the whole app instantly.
 *
 * Behavior:
 *   - If the university has a custom `primaryColor` set → use it
 *   - If the color is the legacy indigo (#4f46e5) → treat as unset, use navy
 *   - If the color is null / empty → use navy default
 *   - If no university is loaded (super-admin landing, login page) → use navy
 */
export function useUniversityTheme() {
    const university = useUniversityStore((s) => s.university)

    useEffect(() => {
        const root = document.documentElement
        const raw = university?.primaryColor
        const effective = normalizeBrandHex(raw) || DEFAULT_BRAND
        const palette = generatePalette(effective)

        Object.entries(palette).forEach(([shade, hex]) => {
            root.style.setProperty(`--color-brand-${shade}`, hex)
        })

        // Also set the meta theme-color for mobile browser chrome
        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) meta.setAttribute('content', palette[600])
    }, [university?.primaryColor])
}