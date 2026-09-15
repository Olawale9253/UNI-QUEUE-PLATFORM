/**
 * Convert an array of objects to CSV and trigger a download.
 *
 * @param {Array<Object>} rows - Array of objects
 * @param {Array<{key: string, label: string}>} columns - Column definitions
 * @param {string} filename - Download filename (without extension)
 */
export function exportToCsv(rows, columns, filename = 'export') {
    if (!rows || rows.length === 0) {
        throw new Error('No data to export')
    }

    // Escape a single cell
    const escape = (value) => {
        if (value === null || value === undefined) return ''
        const s = String(value)
        if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
            return `"${s.replace(/"/g, '""')}"`
        }
        return s
    }

    // Header row
    const header = columns.map((c) => escape(c.label)).join(',')

    // Data rows
    const body = rows
        .map((row) => columns.map((c) => escape(resolvePath(row, c.key))).join(','))
        .join('\n')

    const csv = `\uFEFF${header}\n${body}` // BOM for Excel UTF-8 support

    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

/**
 * Resolve a dot-path on an object: "user.name" → obj.user.name
 */
function resolvePath(obj, path) {
    if (!path) return ''
    return path.split('.').reduce((acc, key) => (acc == null ? '' : acc[key]), obj)
}