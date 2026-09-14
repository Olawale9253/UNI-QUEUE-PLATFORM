import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { History, MapPin, Star, CheckCircle2 } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import FeedbackModal from '../../components/student/FeedbackModal'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { formatDateTime } from '../../lib/format'
import { stagger, staggerItem } from '../../lib/motion'

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
    const [feedbackTicket, setFeedbackTicket] = useState(null)
    const [ratedIds, setRatedIds] = useState(new Set())

    const load = async () => {
        try {
            const res = await api.get('/api/user/tickets/history')
            setTickets(res.data.data || [])
        } catch {
            setTickets([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const handleSubmitted = (ticketId) => {
        setRatedIds((prev) => new Set(prev).add(ticketId))
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    Request History
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Every queue you've joined, with timestamps. Rate completed tickets to help
                    improve service.
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
                        {tickets.map((t) => {
                            const isCompleted = t.status === 'COMPLETED'
                            const alreadyRated = ratedIds.has(t.id)

                            return (
                                <motion.li
                                    key={t.id}
                                    variants={staggerItem}
                                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                                >
                                    <div className="flex min-w-0 items-center gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-semibold text-slate-700">
                                            {t.ticketNumber?.split('-')[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-slate-900">
                          {t.ticketNumber}
                        </span>
                                                <Badge variant={statusVariant[t.status] || 'default'}>
                                                    {t.status}
                                                </Badge>
                                                {alreadyRated && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            Rated
                          </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                            {t.queueName}
                        </span>
                                                <span>Joined {formatDateTime(t.joinedAt)}</span>
                                                {t.completedAt && (
                                                    <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            Completed {formatDateTime(t.completedAt)}
                          </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isCompleted && !alreadyRated && (
                                        <Button
                                            size="sm"
                                            variant="subtle"
                                            icon={Star}
                                            onClick={() => setFeedbackTicket(t)}
                                            className="self-start sm:self-center"
                                        >
                                            Rate service
                                        </Button>
                                    )}
                                </motion.li>
                            )
                        })}
                    </motion.ul>
                </Card>
            )}

            <FeedbackModal
                ticket={feedbackTicket}
                open={!!feedbackTicket}
                onClose={() => setFeedbackTicket(null)}
                onSubmitted={() => handleSubmitted(feedbackTicket?.id)}
            />
        </div>
    )
}