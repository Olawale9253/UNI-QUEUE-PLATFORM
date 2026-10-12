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
    const { r, g, b } = parseHex(hex)
    return `rgba(${r},${g},${b},${alpha})`
}

export function solid(hex) {
    const { r, g, b } = parseHex(hex)
    return `rgb(${r},${g},${b})`
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
    const h = hex.trim().toLowerCase()
    if (h === LEGACY_BRAND_HEX) return DEFAULT_BRAND_HEX
    return hex
}

export const DEFAULT_BRAND = DEFAULT_BRAND_HEX

/* ------------------------------------------------------------------ */
/*  Internals                                                          */
/* ------------------------------------------------------------------ */

function parseHex(hex) {
    if (!hex || typeof hex !== 'string') return FALLBACK
    let h = hex.replace('#', '').trim()
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    if (h.length !== 6 || !/^[0-9a-f]{6}$/i.test(h)) return FALLBACK
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
    }
}

function rgbToHex({ r, g, b }) {
    const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
    return `#${h(r)}${h(g)}${h(b)}`
}

function isValidHex(hex) {
    if (!hex || typeof hex !== 'string') return false
    const h = hex.replace('#', '').trim()
    return /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)
}

function normalizeHex(hex) {
    let h = hex.replace('#', '').trim()
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    return '#' + h.toLowerCase()
}

/**
 * Linear blend between two hex colors.
 *   ratio 0   → returns `fromHex`
 *   ratio 1   → returns `targetHex`
 */
function mix(fromHex, targetHex, ratio) {
    const a = parseHex(fromHex)
    const b = parseHex(targetHex)
    const r = a.r + (b.r - a.r) * ratio
    const g = a.g + (b.g - a.g) * ratio
    const bl = a.b + (b.b - a.b) * ratio
    return rgbToHex({ r, g, b: bl })
}