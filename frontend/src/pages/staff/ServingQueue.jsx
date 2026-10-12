import { motion, AnimatePresence } from 'framer-motion'
import {
    User, CheckCircle2, ListOrdered, Clock, Info, Building2,
    RefreshCw, XCircle, AlertCircle, Ticket, Lock, Users,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import CopyButton from '../../components/ui/CopyButton'
import { SkeletonRow, SkeletonBox } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { stagger, staggerItem } from '../../lib/motion'
import { useNotificationSound } from '../../hooks/useNotificationSound'
import { useBrowserNotifications } from '../../hooks/useBrowserNotifications'
import { syncBus } from '../../lib/syncBus'
import { useEffect, useState, useCallback, useRef } from 'react'

const STATUS_VARIANTS = {
    WAITING: 'warning',
    WAITLISTED: 'info',
    CALLED: 'indigo',
    SERVING: 'indigo',
    COMPLETED: 'success',
    NO_SHOW: 'danger',
    CANCELLED: 'default',
    TRANSFERRED: 'default',
}

const STATUS_LABELS = {
    WAITING: 'Waiting',
    WAITLISTED: 'Waitlisted',
    CALLED: 'Called',
    SERVING: 'Serving',
    COMPLETED: 'Completed',
    NO_SHOW: 'No-show',
    CANCELLED: 'Cancelled',
    TRANSFERRED: 'Transferred',
}

function formatTime(dt) {
    if (!dt) return null
    try {
        return new Date(dt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return null
    }
}

function ServingQueueSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <SkeletonBox className="h-7 w-56" />
                <SkeletonBox className="mt-2 h-4 w-72" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                    <SkeletonBox className="h-5 w-48" />
                    <div className="flex gap-2">
                        <SkeletonBox className="h-10 w-32 rounded-lg" />
                        <SkeletonBox className="h-10 w-28 rounded-lg" />
                    </div>
                </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <SkeletonBox className="h-5 w-40" />
                <div className="mt-8 flex flex-col items-center gap-3">
                    <SkeletonBox className="h-10 w-32" />
                    <SkeletonBox className="h-6 w-20 rounded-full" />
                    <SkeletonBox className="mt-2 h-4 w-40" />
                </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <SkeletonBox className="h-5 w-32" />
                    <SkeletonBox className="h-6 w-8 rounded-full" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonRow key={i} />
                ))}
            </div>
        </div>
    )
}

/**
 * Builds a context-aware message describing the current queue state.
 * Called when the staff clicks "Call Next" but there is nothing to call.
 */
function describeEmptyQueue(queue, tickets) {
    if (!queue) return 'No one is waiting in this queue.'
    const waiting = tickets.filter((t) => t.status === 'WAITING' || t.status === 'WAITLISTED').length
    const serving = tickets.find((t) => t.status === 'CALLED' || t.status === 'SERVING')

    if (queue.isOpen === false) {
        const openAt = queue.opensAt ? String(queue.opensAt).slice(0, 5) : null
        return openAt
            ? `${queue.name} is closed. Reopens at ${openAt}.`
            : `${queue.name} is closed for the day.`
    }
    if (serving) {
        return `${queue.name} has no one waiting — ${serving.ticketNumber} is currently being served.`
    }
    if (waiting === 0) {
        return `No one is waiting in ${queue.name}. New students will appear here as they join.`
    }
    // Fallback — shouldn't normally hit
    return `No one is waiting in ${queue.name}.`
}

export default function ServingQueue() {
    const { user } = useAuthStore()
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [activeQueueId, setActiveQueueId] = useState(null)
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [ticketsLoading, setTicketsLoading] = useState(false)
    const [acting, setActing] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const { playNewTicket, playAttention } = useNotificationSound()
    const browserNotif = useBrowserNotifications()
    const prevTicketIdsRef = useRef(null)

    const actingRef = useRef(false)
    const actionVersionRef = useRef(0)
    const suppressPollUntilRef = useRef(0)
    const lastLocalActionAtRef = useRef(0)

    const activeQueue = queues.find((q) => q.id === activeQueueId) || null
    const isClosed = activeQueue?.isOpen === false

    const loadQueues = useCallback(async () => {
        try {
            const res = await api.get('/api/staff/queues')
            const list = res.data.data || []
            setQueues(list)
            setActiveQueueId((prev) => prev || list[0]?.id || null)
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to load queues',
            })
        } finally {
            setLoading(false)
        }
    }, [push])

    const loadTickets = useCallback(
        async (queueId, showSkeleton = false) => {
            if (!queueId) return
            const startVersion = actionVersionRef.current
            if (showSkeleton) setTicketsLoading(true)
            try {
                const res = await api.get(`/api/staff/queues/${queueId}/tickets`)
                if (actionVersionRef.current !== startVersion) return
                setTickets(res.data.data || [])
            } catch (err) {
                push({
                    type: 'error',
                    message: err.response?.data?.message || 'Failed to load tickets',
                })
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
        if (activeQueueId) {
            setTicketsLoading(true)
            loadTickets(activeQueueId, true)
        }
    }, [activeQueueId, loadTickets])

    useAdaptivePoll(
        () => {
            if (actingRef.current) return Promise.resolve()
            if (Date.now() < suppressPollUntilRef.current) return Promise.resolve()
            return activeQueueId ? loadTickets(activeQueueId, false) : Promise.resolve()
        },
        { fastMs: 5000, slowMs: 30000, enabled: !!activeQueueId }
    )

    useEffect(() => {
        const unsub = syncBus.subscribe('data-changed', (payload) => {
            if (payload?.source === 'serving-queue') return
            loadQueues()
            if (Date.now() - lastLocalActionAtRef.current < 800) return
            if (activeQueueId) loadTickets(activeQueueId, false)
        })
        return unsub
    }, [activeQueueId, loadTickets, loadQueues])

    useEffect(() => {
        if (!tickets.length) return

        const currentIds = new Set(tickets.map((t) => t.id))

        if (prevTicketIdsRef.current === null) {
            prevTicketIdsRef.current = currentIds
            return
        }

        const prev = prevTicketIdsRef.current
        const newTickets = tickets.filter((t) => !prev.has(t.id))
        const newlyCalled = newTickets.filter((t) => t.status === 'CALLED')

        if (newTickets.length > 0) {
            playNewTicket()

            if (browserNotif.permission === 'granted' && localStorage.getItem('uniqueue_staff_prefs')) {
                try {
                    const prefs = JSON.parse(localStorage.getItem('uniqueue_staff_prefs'))
                    if (prefs.browserNotifications) {
                        const title = newTickets.length === 1
                            ? 'New ticket in your queue'
                            : `${newTickets.length} new tickets`
                        const body = newTickets.length === 1
                            ? `${newTickets[0].userFullName} · ${newTickets[0].ticketNumber}`
                            : newTickets.slice(0, 3).map((t) => t.ticketNumber).join(', ')

                        browserNotif.notify(title, body, {
                            tag: 'uniqueue-tickets',
                            onClick: () => {
                                if (activeQueueId) {
                                    window.location.href = `/staff/serving`
                                }
                            },
                        })
                    }
                } catch {}
            }
        }

        if (newlyCalled.length > 0) {
            playAttention()
        }

        prevTicketIdsRef.current = currentIds
    }, [tickets, playNewTicket, playAttention, browserNotif, activeQueueId])

    const act = async (fn, successMsg, actionKey, optimistic) => {
        if (actingRef.current) return

        const snapshot = tickets
        actionVersionRef.current += 1
        actingRef.current = true

        if (optimistic) setTickets((prev) => optimistic(prev))

        setActing(actionKey)
        try {
            await fn()
            push({ type: 'success', message: successMsg })
            suppressPollUntilRef.current = Date.now() + 2000
            lastLocalActionAtRef.current = Date.now()

            syncBus.publish('data-changed', {
                source: 'serving-queue',
                actionKey,
                queueId: activeQueueId,
                at: Date.now(),
            })

            loadQueues()
        } catch (err) {
            const status = err.response?.status
            const message = err.response?.data?.message || ''

            // ─── Empty queue: informational, not an error ───
            if (/no waiting tickets/i.test(message)) {
                push({
                    type: 'info',
                    message: describeEmptyQueue(activeQueue, tickets),
                    duration: 5000,
                })
                // Silent resync in case the queue changed under us
                if (activeQueueId) loadTickets(activeQueueId, false)
                return
            }

            const isConcurrencyConflict =
                status === 400 &&
                /already being called|already served|already in (CALLED|SERVING)|not in CALLED/i.test(message)

            if (isConcurrencyConflict) {
                if (activeQueueId) {
                    setTimeout(() => loadTickets(activeQueueId, false), 300)
                }
            } else {
                // eslint-disable-next-line no-console
                console.error('[ServingQueue] action failed', {
                    actionKey,
                    status,
                    message,
                    data: err.response?.data,
                })
                setTickets(snapshot)
                push({
                    type: 'error',
                    message: message || 'Action failed',
                })
            }
        } finally {
            actingRef.current = false
            setActing(null)
        }
    }

    const callNext = () =>
        act(
            () => api.post(`/api/staff/queues/${activeQueueId}/next`),
            'Next ticket called',
            'next',
            (prev) => {
                if (prev.some((t) => t.status === 'CALLED' || t.status === 'SERVING')) {
                    return prev
                }
                const idx = prev.findIndex(
                    (t) => t.status === 'WAITING' || t.status === 'WAITLISTED'
                )
                if (idx === -1) return prev
                const next = [...prev]
                next[idx] = {
                    ...next[idx],
                    status: 'CALLED',
                    calledAt: new Date().toISOString(),
                }
                return next
            }
        )

    const serve = (id) =>
        act(
            () => api.post(`/api/staff/tickets/${id}/serve`),
            'Service started',
            `serve-${id}`,
            (prev) =>
                prev.map((t) => {
                    if (t.id !== id) return t
                    if (t.status !== 'CALLED') return t
                    return { ...t, status: 'SERVING' }
                })
        )

    const complete = (id) =>
        act(
            () => api.post(`/api/staff/tickets/${id}/complete`),
            'Service completed',
            `complete-${id}`,
            (prev) =>
                prev.map((t) => {
                    if (t.id !== id) return t
                    if (t.status !== 'SERVING') return t
                    return { ...t, status: 'COMPLETED' }
                })
        )

    const noShow = (id) =>
        act(
            () => api.post(`/api/staff/tickets/${id}/no-show`),
            'Marked as no-show',
            `noshow-${id}`,
            (prev) =>
                prev.map((t) => {
                    if (t.id !== id) return t
                    const allowed = ['WAITING', 'WAITLISTED', 'CALLED', 'SERVING']
                    if (!allowed.includes(t.status)) return t
                    return { ...t, status: 'NO_SHOW' }
                })
        )

    const refresh = async () => {
        setRefreshing(true)
        try {
            await loadQueues()
            await loadTickets(activeQueueId, false)
            push({ type: 'success', message: 'Refreshed' })
        } finally {
            setRefreshing(false)
        }
    }

    const called = tickets.find(
        (t) => t.status === 'CALLED' || t.status === 'SERVING'
    )
    const waiting = tickets.filter(
        (t) => t.status === 'WAITING' || t.status === 'WAITLISTED'
    )

    // Dynamic label for the Call Next button
    const callNextLabel = (() => {
        if (isClosed) return 'Closed'
        if (called) return 'Currently serving'
        if (waiting.length === 0) return 'No one waiting'
        return 'Call Next'
    })()

    if (loading) {
        return <ServingQueueSkeleton />
    }

    if (queues.length === 0) {
        return (
            <>
                <div className="mb-5">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Queue Management
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage active queues for your office.
                    </p>
                </div>
                <EmptyState
                    icon={ListOrdered}
                    variant="info"
                    title="No queues assigned to you"
                    description="Once an admin assigns you to a service, it will appear here for you to manage."
                />
            </>
        )
    }

    return (
        <div>
            <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Queue Management
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage active queues for your office.
                </p>
            </div>

            {isClosed && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                    <div className="flex-1 text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-200">
                            This service is currently closed
                        </p>
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                            Students cannot join right now.
                            {activeQueue?.opensAt && (
                                <>
                                    {' '}Reopens at{' '}
                                    <strong>{String(activeQueue.opensAt).slice(0, 5)}</strong>
                                    {activeQueue?.closesAt && (
                                        <> – {String(activeQueue.closesAt).slice(0, 5)}</>
                                    )}
                                    .
                                </>
                            )}
                            {' '}Waiting tickets are automatically cancelled at close.
                        </p>
                    </div>
                </div>
            )}

            <Card className="mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Assigned office:
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {activeQueue?.name || '—'}
                        </span>
                        {isClosed && <Badge variant="default">Closed</Badge>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={callNext}
                            disabled={!!called || !!acting || isClosed}
                            loading={acting === 'next'}
                            className={
                                waiting.length === 0 && !called && !isClosed
                                    ? '!bg-slate-400 hover:!bg-slate-500'
                                    : '!bg-emerald-600 hover:!bg-emerald-700'
                            }
                        >
                            {callNextLabel}
                        </Button>
                        <button
                            onClick={refresh}
                            disabled={refreshing || !!acting}
                            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {queues.length > 1 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        {queues.map((q) => {
                            const isActive = activeQueueId === q.id
                            const waitingCount = q.waitingCount ?? 0
                            const isClosedChip = q.isOpen === false
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setActiveQueueId(q.id)}
                                    disabled={!!acting}
                                    className={`inline-flex items-center gap-2 rounded-lg border-2 px-3 py-2 transition-all disabled:opacity-60 ${
                                        isActive
                                            ? 'border-brand-500 bg-brand-50 dark:border-brand-600 dark:bg-brand-950/40'
                                            : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-700 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    <Building2
                                        className={`h-4 w-4 shrink-0 ${
                                            isActive
                                                ? 'text-brand-600 dark:text-brand-400'
                                                : 'text-slate-400'
                                        }`}
                                    />
                                    <span
                                        className={`max-w-[160px] truncate text-sm font-semibold ${
                                            isActive
                                                ? 'text-slate-900 dark:text-slate-100'
                                                : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        {q.name}
                                    </span>
                                    {isClosedChip && (
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                                            Closed
                                        </span>
                                    )}
                                    <span
                                        className={`ml-1 inline-flex min-w-[28px] items-center justify-center rounded-md px-2 py-0.5 text-sm font-bold tabular-nums ${
                                            waitingCount === 0
                                                ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                                : isActive
                                                    ? 'bg-brand-600 text-white'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                        }`}
                                    >
                                        {waitingCount}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </Card>

            <Card className="mb-6">
                <h3 className="mb-6 text-base font-semibold text-slate-900 dark:text-slate-100">
                    Current Serving
                </h3>

                <AnimatePresence mode="wait">
                    {called ? (
                        <motion.div
                            key={called.id}
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.25 }}
                            className="text-center"
                        >
                            <div className="flex items-center justify-center gap-3">
                                <div className="font-mono text-3xl font-bold tracking-tight text-brand-600 dark:text-brand-400 sm:text-4xl">
                                    {called.ticketNumber}
                                </div>
                                <CopyButton text={called.ticketNumber} title="Copy ticket ID" />
                            </div>

                            <div className="mt-3 flex justify-center">
                                <Badge variant={STATUS_VARIANTS[called.status] || 'default'}>
                                    {STATUS_LABELS[called.status] || called.status}
                                </Badge>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    {called.userFullName}
                                </span>
                                {called.matricNumber && (
                                    <span className="font-mono text-xs">
                                        Matric: {called.matricNumber}
                                    </span>
                                )}
                                {called.calledAt && (
                                    <span className="flex items-center gap-1.5 text-xs">
                                        <Clock className="h-3 w-3" />
                                        Called {formatTime(called.calledAt)}
                                    </span>
                                )}
                            </div>

                            <div className="mt-6 flex justify-center">
                                <div className="inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900 dark:bg-amber-950/40">
                                    <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                        Waiting
                                    </span>
                                    <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                                        {waiting.length}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {called.status === 'CALLED' && (
                                    <Button
                                        onClick={() => serve(called.id)}
                                        disabled={!!acting}
                                        loading={acting === `serve-${called.id}`}
                                    >
                                        Start Service
                                    </Button>
                                )}
                                {called.status === 'SERVING' && (
                                    <Button
                                        variant="success"
                                        icon={CheckCircle2}
                                        onClick={() => complete(called.id)}
                                        disabled={!!acting}
                                        loading={acting === `complete-${called.id}`}
                                    >
                                        Complete
                                    </Button>
                                )}
                                <button
                                    onClick={() => noShow(called.id)}
                                    disabled={!!acting}
                                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                                >
                                    <XCircle className="h-4 w-4" />
                                    {acting === `noshow-${called.id}` ? 'Marking…' : 'No-show'}
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-8 text-center"
                        >
                            <div className="text-3xl font-bold text-slate-300 dark:text-slate-600 sm:text-4xl">
                                None
                            </div>
                            <div className="mt-5 flex justify-center">
                                <div className="inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900 dark:bg-amber-950/40">
                                    <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                        Waiting
                                    </span>
                                    <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                                        {waiting.length}
                                    </span>
                                </div>
                            </div>

                            {waiting.length === 0 && !isClosed && (
                                <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
                                    No students are waiting. New tickets will appear here as they join.
                                </p>
                            )}

                            {waiting.length > 0 && !isClosed && (
                                <button
                                    onClick={callNext}
                                    disabled={!!acting}
                                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    <Ticket className="h-4 w-4" />
                                    {acting === 'next' ? 'Calling…' : 'Call Next Ticket'}
                                </button>
                            )}

                            {waiting.length > 0 && isClosed && (
                                <p className="mt-5 text-xs text-amber-700 dark:text-amber-400">
                                    Service is closed — Call Next is disabled.
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            <Card padded={false}>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Waiting Tickets
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {waiting.length}
                    </span>
                </div>

                {ticketsLoading ? (
                    <div>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <SkeletonRow key={i} />
                        ))}
                    </div>
                ) : waiting.length === 0 ? (
                    <EmptyState
                        icon={ListOrdered}
                        variant={isClosed ? 'warning' : 'neutral'}
                        size="sm"
                        bordered={false}
                        title={isClosed ? 'Service is closed' : 'No waiting tickets'}
                        description={
                            isClosed
                                ? 'New tickets will appear here when the service reopens.'
                                : 'New tickets will appear here automatically as students join.'
                        }
                    />
                ) : (
                    <motion.ul
                        variants={stagger(0, 0.04)}
                        initial="initial"
                        animate="animate"
                        className="divide-y divide-slate-100 dark:divide-slate-800"
                    >
                        {waiting.map((t, i) => (
                            <motion.li
                                key={t.id}
                                variants={staggerItem}
                                layout
                                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-brand-600 dark:bg-slate-800 dark:text-brand-400">
                                        {t.position ?? i + 1}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                                                {t.ticketNumber}
                                            </span>
                                            <CopyButton text={t.ticketNumber} title="Copy ticket ID" />
                                            <Badge variant={STATUS_VARIANTS[t.status] || 'default'}>
                                                {STATUS_LABELS[t.status] || t.status}
                                            </Badge>
                                        </div>
                                        <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
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

                                <button
                                    onClick={() => noShow(t.id)}
                                    disabled={!!acting}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                    {acting === `noshow-${t.id}` ? 'Marking…' : 'No-show'}
                                </button>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </Card>
        </div>
    )
}