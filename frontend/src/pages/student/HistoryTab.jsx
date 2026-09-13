import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { History, MapPin } from 'lucide-react'
import api from '../../api/axios.js'
import Card from '../../components/ui/Card.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { SkeletonRow } from '../../components/ui/Skeleton.jsx'
import { formatDateTime } from '../../lib/format.js'
import { stagger, staggerItem } from '../../lib/motion.js'

const statusVariant = {
    WAITING: 'warning',
    WAITLISTED: 'info',
    CALLED: 'indigo',
    SERVING: 'indigo',
    COMPLETED: 'success',
    NO_SHOW: 'danger',
    CANCELLED: 'default',
    TRANSFERRED: 'default',
}

export default function HistoryTab() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api
            .get('/api/user/tickets/history')
            .then((r) => setTickets(r.data.data || []))
            .catch(() => setTickets([]))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    Ticket history
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Every queue you've joined, with timestamps.
                </p>
            </div>

            {loading ? (
                <Card padded={false}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonRow key={i} />
                    ))}
                </Card>
            ) : tickets.length === 0 ? (
                <EmptyState
                    icon={History}
                    title="No ticket history yet"
                    description="Once you join a queue, your tickets will appear here."
                />
            ) : (
                <Card padded={false}>
                    <motion.ul
                        variants={stagger(0, 0.03)}
                        initial="initial"
                        animate="animate"
                        className="divide-y divide-slate-100"
                    >
                        {tickets.map((t) => (
                            <motion.li
                                key={t.id}
                                variants={staggerItem}
                                className="flex items-center justify-between px-6 py-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-semibold text-slate-700">
                                        {t.ticketNumber?.split('-')[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {t.ticketNumber}
                      </span>
                                            <Badge variant={statusVariant[t.status] || 'default'}>
                                                {t.status}
                                            </Badge>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                          {t.queueName}
                      </span>
                                            <span>Joined {formatDateTime(t.joinedAt)}</span>
                                            {t.completedAt && <span>· Completed {formatDateTime(t.completedAt)}</span>}
                                        </div>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </motion.ul>
                </Card>
            )}
        </div>
    )
}