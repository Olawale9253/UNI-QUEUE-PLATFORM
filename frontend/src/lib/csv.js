/**
 * Convert an array of objects to CSV and trigger a download.
 *
 * Improvements over the previous version:
 *   - CRLF line endings (Excel-friendly, avoids collapsed rows)
 *   - Native Date / Array / Object serialization
 *   - Function-based column values: { value: (row) => ... } alongside dot-paths
 *   - Returns the generated filename (or null on empty) instead of throwing
 *   - Timestamp includes hours + minutes so two exports in the same day don't clash
 *   - Same public API: exportToCsv(rows, columns, filename)
 *
 * @param {Array<Object>} rows                - Array of objects
 * @param {Array<{key, label, value?}>} cols  - Column definitions
 * @param {string} filename                   - Base name (no extension)
 * @returns {string|null}                     - Final filename or null if nothing to export
 */
export function exportToCsv(rows, columns, filename = 'export') {
    if (!Array.isArray(rows) || rows.length === 0) return null
    if (!Array.isArray(columns) || columns.length === 0) return null

    const header = columns.map((column) => escapeCell(column.label ?? column.key)).join(',')

    const body = rows
        .map((row) =>
            columns
                .map((columnValue) => {
                    const raw = typeof columnValue.value === 'function'
                        ? columnValue.value(row)
                        : resolvePath(row, columnValue.key)
                    return escapeCell(raw)
                })
                .join(',')
        )
        .join('\r\n')

    const csv = `\uFEFF${header}\r\n${body}` // BOM so Excel reads UTF-8

    const finalName = `${filename}-${timestampSlug(new Date())}.csv`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = finalName
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Release the object URL after the download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    return finalName
}

/* ------------------------------------------------------------------ */
/*  Internals                                                          */
/* ------------------------------------------------------------------ */

function escapeCell(value) {
    if (value === null || value === undefined) return ''

    let stringValue
    if (typeof value === 'string') stringValue = value
    else if (typeof value === 'number' || typeof value === 'boolean') stringValue = String(value)
    else if (value instanceof Date) stringValue = value.toISOString()
    else if (Array.isArray(value)) stringValue = value.join(', ')
    else if (typeof value === 'object') stringValue = JSON.stringify(value)
    else stringValue = String(value)

    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
}

/** Resolve a dot-path on an object: "user.name" → obj.user.name */
function resolvePath(obj, path) {
    if (!path) return ''
    return path.split('.').reduce((acc, key) => (acc == null ? '' : acc[key]), obj)
}

/** "2026-10-12-0930" — date + hour + minute */
function timestampSlug(dateValue) {
    const pad = (count) => String(count).padStart(2, '0')
    return (
        dateValue.getFullYear() +
        '-' + pad(dateValue.getMonth() + 1) +
        '-' + pad(dateValue.getDate()) +
        '-' + pad(dateValue.getHours()) + pad(dateValue.getMinutes())
    )
}