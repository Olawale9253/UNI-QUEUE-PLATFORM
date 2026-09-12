export function formatTimeAgo(iso) {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    return `${d}d ago`
}

export function formatDateTime(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatTime(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getInitials(name) {
    if (!name) return '?'
    return name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}