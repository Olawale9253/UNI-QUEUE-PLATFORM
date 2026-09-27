/**
 * Groups queues/services by office.
 *
 * Priority: q.officeName → q.department → "General".
 * Never produces an "unassigned" bucket.
 */
export function groupQueuesByOffice(queues = []) {
    const map = new Map()

    for (const q of queues) {
        const raw = (q.officeName || q.department || '').trim()
        const label = raw.length > 0 ? raw : 'General'
        const key = label.toLowerCase()
        if (!map.has(key)) {
            map.set(key, {
                key,
                label,
                queues: [],
                waitingTotal: 0,
            })
        }
        const group = map.get(key)
        group.queues.push(q)
        group.waitingTotal += q.waitingCount ?? 0
    }

    const groups = Array.from(map.values())
    for (const g of groups) {
        g.totalQueues = g.queues.length
    }

    return groups.sort((a, b) => a.label.localeCompare(b.label))
}

/** Backward-compat alias. */
export const groupQueuesByDepartment = groupQueuesByOffice