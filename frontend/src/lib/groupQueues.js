/**
 * Groups queues by their `department` field.
 *
 * Returns an array of groups in this order:
 *   1. All departments alphabetically (queues with a department set)
 *   2. "Other" bucket at the end (queues with no department)
 *
 * Each group: { key, label, queues, waitingTotal, isOther }
 *
 * @param {Array<Queue>} queues
 * @returns {Array<Group>}
 */
export function groupQueuesByDepartment(queues = []) {
    const map = new Map()

    for (const q of queues) {
        const raw = (q.department || '').trim()
        const key = raw.length > 0 ? raw : '__other__'
        if (!map.has(key)) {
            map.set(key, {
                key,
                label: raw.length > 0 ? raw : 'Other',
                isOther: raw.length === 0,
                queues: [],
                waitingTotal: 0,
            })
        }
        const group = map.get(key)
        group.queues.push(q)
        group.waitingTotal += q.waitingCount ?? 0
    }

    return Array.from(map.values()).sort((a, b) => {
        // "Other" always last
        if (a.isOther && !b.isOther) return 1
        if (!a.isOther && b.isOther) return -1
        return a.label.localeCompare(b.label)
    })
}