/**
 * Color helpers.
 *
 *   withAlpha('#1e3a8a', 0.15)  → 'rgba(30,58,138,0.15)'
 *   solid('#1e3a8a')             → 'rgb(30,58,138)'
 *   generatePalette('#8b0000')   → { 50: '#fdf3f3', 100: '...', ..., 950: '...' }
 *
 * The palette produces Tailwind-compatible 50–950 shades by mixing the input
 * color with white (lighter) or black (darker) at fixed ratios. The input hex
 * is treated as the "600" shade — that's what people mean when they say
 * "the brand color."
 *
 * Default brand color is now deep navy (#1e3a8a) — professional, institutional,
 * doesn't clash with any university's crest. Universities with their own color
 * set in the DB override this per-user via useUniversityTheme().
 */

const DEFAULT_BRAND_HEX = '#1e3a8a'          // deep navy
const LEGACY_BRAND_HEX = '#4f46e5'           // old Tailwind indigo — treated as "unset"

const FALLBACK = { r: 30, g: 58, b: 138 }    // rgb of deep navy

/* ------------------------------------------------------------------ */
/*  Public helpers                                                     */
/* ------------------------------------------------------------------ */

export function withAlpha(hex, alpha = 1) {
    const { r: red, g: green, b: blue } = parseHex(hex)
    return `rgba(${red},${green},${blue},${alpha})`
}

export function solid(hex) {
    const { r: red, g: green, b: blue } = parseHex(hex)
    return `rgb(${red},${green},${blue})`
}

/**
 * Turn one hex into the full 50–950 scale used across the app.
 * The given color becomes shade 600.
 */
export function generatePalette(hex) {
    const normalized = normalizeBrandHex(hex)
    const base = isValidHex(normalized) ? normalizeHex(normalized) : DEFAULT_BRAND_HEX

    const mixWhite = (ratio) => mix(base, '#ffffff', ratio)
    const mixBlack = (ratio) => mix(base, '#000000', ratio)

    return {
        50:  mixWhite(0.95),
        100: mixWhite(0.88),
        200: mixWhite(0.72),
        300: mixWhite(0.52),
        400: mixWhite(0.30),
        500: mixWhite(0.14),
        600: base,
        700: mixBlack(0.15),
        800: mixBlack(0.30),
        900: mixBlack(0.45),
        950: mixBlack(0.68),
    }
}

/**
 * If the given hex is the legacy indigo (#4f46e5 — the old app default),
 * return the new navy default. Otherwise return it unchanged. This lets
 * existing universities automatically pick up the new navy look without
 * a DB migration — any university whose color was never explicitly set
 * falls back to navy.
 */
export function normalizeBrandHex(hex) {
    if (!hex || typeof hex !== 'string') return DEFAULT_BRAND_HEX
    const normalizedHex = hex.trim().toLowerCase()
    if (normalizedHex === LEGACY_BRAND_HEX) return DEFAULT_BRAND_HEX
    return hex
}

export const DEFAULT_BRAND = DEFAULT_BRAND_HEX

/* ------------------------------------------------------------------ */
/*  Internals                                                          */
/* ------------------------------------------------------------------ */

function parseHex(hex) {
    if (!hex || typeof hex !== 'string') return FALLBACK
    let hexDigits = hex.replace('#', '').trim()
    if (hexDigits.length === 3) hexDigits = hexDigits.split('').map((character) => character + character).join('')
    if (hexDigits.length !== 6 || !/^[0-9a-f]{6}$/i.test(hexDigits)) return FALLBACK
    return {
        r: parseInt(hexDigits.slice(0, 2), 16),
        g: parseInt(hexDigits.slice(2, 4), 16),
        b: parseInt(hexDigits.slice(4, 6), 16),
    }
}

function rgbToHex({ r: red, g: green, b: blue }) {
    const hexComponent = (channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0')
    return `#${hexComponent(red)}${hexComponent(green)}${hexComponent(blue)}`
}

function isValidHex(hex) {
    if (!hex || typeof hex !== 'string') return false
    const normalizedHex = hex.replace('#', '').trim()
    return /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalizedHex)
}

function normalizeHex(hex) {
    let normalizedHex = hex.replace('#', '').trim()
    if (normalizedHex.length === 3) normalizedHex = normalizedHex.split('').map((character) => character + character).join('')
    return '#' + normalizedHex.toLowerCase()
}

/**
 * Linear blend between two hex colors.
 *   ratio 0   → returns `fromHex`
 *   ratio 1   → returns `targetHex`
 */
function mix(fromHex, targetHex, ratio) {
    const fromColor = parseHex(fromHex)
    const targetColor = parseHex(targetHex)
    const red = fromColor.r + (targetColor.r - fromColor.r) * ratio
    const green = fromColor.g + (targetColor.g - fromColor.g) * ratio
    const blue = fromColor.b + (targetColor.b - fromColor.b) * ratio
    return rgbToHex({ r: red, g: green, b: blue })
}