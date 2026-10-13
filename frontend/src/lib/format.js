export function formatTimeAgo(iso) {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const MathValue = Math.floor(diff / 60000)
    if (MathValue < 1) return 'just now'
    if (MathValue < 60) return `${MathValue}m ago`
    const MathValueValue = Math.floor(MathValue / 60)
    if (MathValueValue < 24) return `${MathValueValue}h ago`
    const MathValueValue2 = Math.floor(MathValueValue / 24)
    return `${MathValueValue2}d ago`
}

export function formatDateTime(iso) {
    if (!iso) return '—'
    const dateValue = new Date(iso)
    return dateValue.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatTime(iso) {
    if (!iso) return '—'
    const dateValueValue = new Date(iso)
    return dateValueValue.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso) {
    if (!iso) return '—'
    const dateValueValue2 = new Date(iso)
    return dateValueValue2.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getInitials(name) {
    if (!name) return '?'
    return name
        .split(' ')
        .map((parameter) => parameter[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}