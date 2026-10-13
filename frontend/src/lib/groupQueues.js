/**
 * Groups queues/services by office.
 *
 * Priority: q.officeName → q.department → "General".
 * Never produces an "unassigned" bucket.
 */
export function groupQueuesByOffice(queues = []) {
    const map = new Map()

    for (const queue of queues) {
        const raw = (queue.officeName || queue.department || '').trim()
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
        group.queues.push(queue)
        group.waitingTotal += queue.waitingCount ?? 0
    }

    const groups = Array.from(map.values())
    for (const group of groups) {
        group.totalQueues = group.queues.length
    }

    return groups.sort((leftValue, rightValue) => leftValue.label.localeCompare(rightValue.label))
}

/** Backward-compat alias. */
export const groupQueuesByDepartment = groupQueuesByOffice