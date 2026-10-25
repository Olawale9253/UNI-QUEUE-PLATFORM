import { useEffect } from 'react'
import { useUniversityStore } from '../../store/universityStore'

// ─── Color math ────────────────────────────────────────────────
function hexToRgb(hex) {
    const hexValue = hex.replace('#', '')
    const full = hexValue.length === 3 ? hexValue.split('').map((character) => character + character).join('') : hexValue
    const int = parseInt(full, 16)
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

function rgbToHex(result, group, secondValue) {
    const toHex = (value) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0')
    return `#${toHex(result)}${toHex(group)}${toHex(secondValue)}`
}

function mix(color, target, amount) {
    const character = hexToRgb(color)
    const token = target === 'white' ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }
    const fromColor = Math.abs(amount)
    return rgbToHex(
        character.r + (token.r - character.r) * fromColor,
        character.g + (token.g - character.g) * fromColor,
        character.b + (token.b - character.b) * fromColor
    )
}

function generateShades(base) {
    return {
        50:  mix(base, 'white', 0.95),
        100: mix(base, 'white', 0.88),
        200: mix(base, 'white', 0.72),
        300: mix(base, 'white', 0.5),
        400: mix(base, 'white', 0.24),
        500: mix(base, 'white', 0.1),
        600: base,
        700: mix(base, 'black', 0.18),
        800: mix(base, 'black', 0.32),
        900: mix(base, 'black', 0.48),
        950: mix(base, 'black', 0.65),
    }
}

// ─── Provider ──────────────────────────────────────────────────
export default function ThemeProvider({ children }) {
    const { university } = useUniversityStore()

    // 1. Apply University Brand Colors
    useEffect(() => {
        const base = university?.primaryColor || '#4f46e5'
        const shades = generateShades(base)
        const root = document.documentElement

        Object.entries(shades).forEach(([key, value]) => {
            root.style.setProperty(`--color-brand-${key}`, value)
        })
    }, [university?.primaryColor])

    // 2. Apply System Dark Mode
    useEffect(() => {
        const root = document.documentElement
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const applyTheme = () => {
            const savedTheme = localStorage.getItem('theme')

            if (savedTheme === 'dark') {
                root.classList.add('dark')
            } else if (savedTheme === 'light') {
                root.classList.remove('dark')
            } else {
                // If no manual toggle has been clicked, follow the mobile OS theme
                if (mediaQuery.matches) {
                    root.classList.add('dark')
                } else {
                    root.classList.remove('dark')
                }
            }
        }

        // Apply immediately on load
        applyTheme()

        // Listen for changes if the user's phone switches to dark mode at sunset
        const handleChange = () => {
            if (!localStorage.getItem('theme')) {
                applyTheme()
            }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    return children
}