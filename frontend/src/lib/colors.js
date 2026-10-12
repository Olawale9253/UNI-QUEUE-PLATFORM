const FALLBACK = { r: 79, g: 70, b: 229 } // brand indigo

export function withAlpha(hex, alpha = 1) {
    const { r, g, b } = parseHex(hex)
    return `rgba(${r},${g},${b},${alpha})`
}

/** Returns a copy of the same color at full opacity (useful for text). */
export function solid(hex) {
    const { r, g, b } = parseHex(hex)
    return `rgb(${r},${g},${b})`
}

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