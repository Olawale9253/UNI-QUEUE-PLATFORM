/**
 * Groups queues by `department`, and within each department by `subDepartment`.
 *
 * Returns:
 *   [
 *     {
 *       key, label, isOther,
 *       queues,        // queues in this dept with NO sub-department
 *       subGroups: [   // [{ key, label, queues }], sorted alphabetically
 *         { key, label, queues }
 *       ],
 *       waitingTotal,
 *       totalQueues,   // direct queues + all sub-group queues
 *     }
 *   ]
 *
 * Order: alphabetical departments, "Other" (no department) last.
 */
export function groupQueuesByDepartment(queues = []) {
    const map = new Map()

    for (const q of queues) {
        const rawDept = (q.department || '').trim()
        const key = rawDept.length > 0 ? rawDept : '__other__'

        if (!map.has(key)) {
            map.set(key, {
                key,
                label: rawDept.length > 0 ? rawDept : 'Other',
                isOther: rawDept.length === 0,
                queues: [],           // no sub-department
                subGroups: [],
                _subMap: new Map(),   // temp lookup, stripped before return
                waitingTotal: 0,
                totalQueues: 0,
            })
        }

        const group = map.get(key)
        group.waitingTotal += q.waitingCount ?? 0

        const rawSub = (q.subDepartment || '').trim()
        if (rawSub.length > 0) {
            if (!group._subMap.has(rawSub)) {
                const subGroup = { key: rawSub, label: rawSub, queues: [] }
                group._subMap.set(rawSub, subGroup)
                group.subGroups.push(subGroup)
            }
            group._subMap.get(rawSub).queues.push(q)
        } else {
            group.queues.push(q)
        }
    }

    const groups = Array.from(map.values())

    for (const g of groups) {
        // Sort sub-groups alphabetically
        g.subGroups.sort((a, b) => a.label.localeCompare(b.label))
        // totalQueues = direct + all in sub-groups
        g.totalQueues =
            g.queues.length +
            g.subGroups.reduce((sum, s) => sum + s.queues.length, 0)
        // Remove temp lookup
        delete g._subMap
    }

    return groups.sort((a, b) => {
        if (a.isOther && !b.isOther) return 1
        if (!a.isOther && b.isOther) return -1
        return a.label.localeCompare(b.label)
    })
}