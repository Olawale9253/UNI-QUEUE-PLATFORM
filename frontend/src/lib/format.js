function parseIso(iso) {
    if (!iso) return null
    const hasTz = /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso)
    return new Date(hasTz ? iso : `${iso}Z`)
}

export function formatTimeAgo(iso) {
    const date = parseIso(iso)
    if (!date) return '—'
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export function formatDateTime(iso) {
    const date = parseIso(iso)
    if (!date) return '—'
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatTime(iso) {
    const date = parseIso(iso)
    if (!date) return '—'
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso) {
    const date = parseIso(iso)
    if (!date) return '—'
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getInitials(name) {
    if (!name) return '?'
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}