import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronRight,
    User,
    CheckCircle2,
    ListOrdered,
    Clock,
    Info,
    Building2,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import StaffStatsCards from '../../components/staff/StaffStatsCards'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { groupQueuesByDepartment } from '../../lib/groupQueues'
import { ease, stagger, staggerItem } from '../../lib/motion'

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

const statusDescription = {
    WAITING: 'Waiting to be called',
    WAITLISTED: 'On the overflow waitlist',
    CALLED: 'Called but not yet serving',
    SERVING: 'Currently being served',
    COMPLETED: 'Service finished',
    NO_SHOW: 'Missed their turn',
    CANCELLED: 'Left the queue',
    TRANSFERRED: 'Sent to another desk',
}

export default function ServingQueue() {
    const { user } = useAuthStore()
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [activeQueue, setActiveQueue] = useState(null)
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [ticketsLoading, setTicketsLoading] = useState(false)
    const [acting, setActing] = useState(null)

    const loadQueues = useCallback(async () => {
        try {
            const res = await api.get('/api/staff/queues')
            const list = res.data.data || []
            setQueues(list)
            setActiveQueue((prev) => prev || list[0] || null)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load queues' })
        } finally {
            setLoading(false)
        }
    }, [push])

    const loadTickets = useCallback(
        async (queueId, showSkeleton = false) => {
            if (!queueId) return
            if (showSkeleton) setTicketsLoading(true)
            try {
                const res = await api.get(`/api/staff/queues/${queueId}/tickets`)
                setTickets(res.data.data || [])
            } catch (err) {
                push({ type: 'error', message: err.response?.data?.message || 'Failed to load tickets' })
            } finally {
                if (showSkeleton) setTicketsLoading(false)
            }
        },
        [push]
    )

    useEffect(() => {
        loadQueues()
    }, [loadQueues])

    useEffect(() => {
        if (activeQueue) {
            setTicketsLoading(true)
            loadTickets(activeQueue.id, true)
        }
    }, [activeQueue, loadTickets])

    useAdaptivePoll(
        () => (activeQueue ? loadTickets(activeQueue.id, false) : Promise.resolve()),
        { fastMs: 5000, slowMs: 30000, enabled: !!activeQueue }
    )

    const act = async (fn, successMessage, actionKey) => {
        setActing(actionKey)
        try {
            await fn()
            push({ type: 'success', message: successMessage })
            await loadTickets(activeQueue.id)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Action failed' })
        } finally {
            setActing(null)
        }
    }

    const callNext = () =>
        act(
            () => api.post(`/api/staff/queues/${activeQueue.id}/next`),
            'Next ticket called',
            'next'
        )
    const serve = (id) =>
        act(() => api.post(`/api/staff/tickets/${id}/serve`), 'Ticket served', `serve-${id}`)
    const complete = (id) =>
        act(() => api.post(`/api/staff/tickets/${id}/complete`), 'Ticket completed', `complete-${id}`)
    const noShow = (id) =>
        act(() => api.post(`/api/staff/tickets/${id}/no-show`), 'Marked as no-show', `noshow-${id}`)

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-12 w-1/3 animate-pulse rounded-lg bg-slate-200" />
                <div className="rounded-xl border border-slate-200 bg-white">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonRow key={i} />
                    ))}
                </div>
            </div>
        )
    }

    if (queues.length === 0) {
        return (
            <>
                <PageHeader title="Serving Queue" description={`Signed in as ${user?.fullName}`} />
                <StaffStatsCards />
                <EmptyState
                    icon={ListOrdered}
                    title="No queues assigned"
                    description="You haven't been assigned to any queues yet. Contact your administrator to get started."
                />
            </>
        )
    }

    const called = tickets.find((t) => t.status === 'CALLED' || t.status === 'SERVING')
    const waiting = tickets.filter(
        (t) => t.status === 'WAITING' || t.status === 'WAITLISTED'
    )
    const resolved = tickets.filter((t) =>
        ['COMPLETED', 'NO_SHOW', 'CANCELLED', 'TRANSFERRED'].includes(t.status)
    )

    const queueGroups = groupQueuesByDepartment(queues)

    return (
        <>
            <PageHeader
                title="Serving Queue"
                description={`Serving students at ${activeQueue?.name || 'your queue'}`}
                action={
                    <Button
                        onClick={callNext}
                        disabled={!activeQueue || acting === 'next' || !!called}
                        loading={acting === 'next'}
                    >
                        {called ? 'Serving…' : 'Call next ticket'}
                    </Button>
                }
            />

            {/* Personal stats */}
            <StaffStatsCards />

            <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <div>
                    <p className="font-medium">How this works</p>
                    <p className="mt-1 text-xs text-sky-800">
                        Click{' '}
                        <span className="rounded bg-white px-1.5 py-0.5 font-medium">
              Call next ticket
            </span>{' '}
                        to bring the next student up. Then{' '}
                        <span className="rounded bg-white px-1.5 py-0.5 font-medium">
              Start service
            </span>{' '}
                        and{' '}
                        <span className="rounded bg-white px-1.5 py-0.5 font-medium">Complete</span>{' '}
                        when done.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Sidebar: grouped by department */}
                <div className="lg:col-span-1">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        My queues
                    </h2>

                    <div className="space-y-5">
                        {queueGroups.map((group) => (
                            <div key={group.key}>
                                {/* Department label */}
                                <div className="mb-1.5 flex items-center gap-1.5 px-1">
                                    <Building2 className="h-3 w-3 text-brand-600" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    {group.label}
                  </span>
                                    <span className="text-[10px] text-slate-400">
                    ({group.queues.length})
                  </span>
                                </div>

                                {/* Queues in this department */}
                                <div className="space-y-2">
                                    {group.queues.map((q) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setActiveQueue(q)}
                                            className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                                                activeQueue?.id === q.id
                                                    ? 'border-brand-300 bg-brand-50'
                                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <div
                                                        className={`truncate text-sm font-medium ${
                                                            activeQueue?.id === q.id
                                                                ? 'text-brand-900'
                                                                : 'text-slate-900'
                                                        }`}
                                                    >
                                                        {q.name}
                                                    </div>
                                                    {q.location && (
                                                        <div className="mt-0.5 truncate text-xs text-slate-500">
                                                            {q.location}
                                                        </div>
                                                    )}
                                                </div>
                                                {activeQueue?.id === q.id && (
                                                    <ChevronRight className="h-4 w-4 text-brand-600" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main panel */}
                <div className="space-y-6 lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {called && (
                            <motion.div
                                key={called.id}
                                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                transition={{ duration: 0.35, ease }}
                            >
                                <Card className="border-brand-200 bg-brand-50/50">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                      </span>
                                            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                                                Now serving
                                            </h3>
                                        </div>
                                        <Badge variant="indigo">{called.status}</Badge>
                                    </div>

                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="font-mono text-3xl font-semibold text-slate-900 sm:text-4xl">
                                                {called.ticketNumber}
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                            {called.userFullName}
                        </span>
                                                {called.matricNumber && (
                                                    <span className="font-mono text-xs">
                            Matric: {called.matricNumber}
                          </span>
                                                )}
                                            </div>
                                            <p className="mt-2 text-xs text-slate-500">
                                                {statusDescription[called.status]}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {called.status === 'CALLED' && (
                                                <>
                                                    <Button
                                                        onClick={() => serve(called.id)}
                                                        disabled={acting === `serve-${called.id}`}
                                                        loading={acting === `serve-${called.id}`}
                                                    >
                                                        Start service
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => noShow(called.id)}
                                                        disabled={acting === `noshow-${called.id}`}
                                                        loading={acting === `noshow-${called.id}`}
                                                        className="text-rose-600 hover:bg-rose-50"
                                                    >
                                                        No-show
                                                    </Button>
                                                </>
                                            )}
                                            {(called.status === 'SERVING' || called.status === 'CALLED') && (
                                                <Button
                                                    variant="success"
                                                    icon={CheckCircle2}
                                                    onClick={() => complete(called.id)}
                                                    disabled={acting === `complete-${called.id}`}
                                                    loading={acting === `complete-${called.id}`}
                                                >
                                                    Complete service
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Card padded={false}>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Waiting in queue
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Sorted by priority, then by join time (FIFO).
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {waiting.length} {waiting.length === 1 ? 'ticket' : 'tickets'}
              </span>
                        </div>

                        {ticketsLoading ? (
                            <div>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <SkeletonRow key={i} />
                                ))}
                            </div>
                        ) : waiting.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <ListOrdered className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-900">No one is waiting</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    New tickets will appear here automatically.
                                </p>
                            </div>
                        ) : (
                            <motion.ul
                                variants={stagger(0, 0.04)}
                                initial="initial"
                                animate="animate"
                                className="divide-y divide-slate-100"
                            >
                                {waiting.map((t, i) => (
                                    <motion.li
                                        key={t.id}
                                        variants={staggerItem}
                                        layout
                                        className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6"
                                    >
                                        <div className="flex min-w-0 items-center gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                                                {t.position ?? i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-slate-900">
                            {t.ticketNumber}
                          </span>
                                                    <Badge variant={statusVariant[t.status] || 'default'}>
                                                        {t.status}
                                                    </Badge>
                                                </div>
                                                <div className="mt-0.5 truncate text-xs text-slate-500">
                                                    {t.userFullName}
                                                    {t.matricNumber ? ` · ${t.matricNumber}` : ''}
                                                </div>
                                                {t.estimatedMinutesRemaining != null && (
                                                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                                        <Clock className="h-3 w-3" />
                                                        ~{t.estimatedMinutesRemaining} min remaining
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            <button
                                                onClick={() => noShow(t.id)}
                                                disabled={acting === `noshow-${t.id}`}
                                                className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                            >
                                                No-show
                                            </button>
                                        </div>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        )}
                    </Card>

                    {resolved.length > 0 && (
                        <Card padded={false}>
                            <div className="border-b border-slate-100 px-6 py-4">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Recently resolved
                                </h3>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {resolved.slice(0, 5).map((t) => (
                                    <li
                                        key={t.id}
                                        className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                      <span className="font-mono text-sm font-medium text-slate-700">
                        {t.ticketNumber}
                      </span>
                                            <span className="truncate text-xs text-slate-500">
                        {t.userFullName}
                      </span>
                                        </div>
                                        <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            </div>
        </>
    )
}