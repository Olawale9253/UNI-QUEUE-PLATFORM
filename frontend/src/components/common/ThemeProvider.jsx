import { useEffect } from 'react'
import { useUniversityStore } from '../../store/universityStore'

// ─── Color math ────────────────────────────────────────────────
// Convert hex → { r, g, b } in 0-255
function hexToRgb(hex) {
    const hexValue = hex.replace('#', '')
    const full = hexValue.length === 3 ? hexValue.split('').map((character) => character + character).join('') : hexValue
    const int = parseInt(full, 16)
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

// { r, g, b } → hex
function rgbToHex(result, group, secondValue) {
    const toHex = (value) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0')
    return `#${toHex(result)}${toHex(group)}${toHex(secondValue)}`
}

// Mix color toward white (amount 0..1) or toward black (amount -1..0)
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

// Generate a Tailwind-like 50..950 scale from a single base color
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

    useEffect(() => {
        const base = university?.primaryColor || '#4f46e5'
        const shades = generateShades(base)
        const root = document.documentElement

        Object.entries(shades).forEach(([key, value]) => {
            root.style.setProperty(`--color-brand-${key}`, value)
        })
    }, [university?.primaryColor])

    return children
}