import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User, CheckCircle2, ListOrdered, Clock, Info, Building2,
    RefreshCw, XCircle, AlertCircle, Ticket, Lock,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import CopyButton from '../../components/ui/CopyButton'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { stagger, staggerItem } from '../../lib/motion'

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
            if (showSkeleton) setTicketsLoading(true)
            try {
                const res = await api.get(`/api/staff/queues/${queueId}/tickets`)
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
        () => (activeQueueId ? loadTickets(activeQueueId, false) : Promise.resolve()),
        { fastMs: 5000, slowMs: 30000, enabled: !!activeQueueId }
    )

    const act = async (fn, successMessage, actionKey) => {
        setActing(actionKey)
        try {
            await fn()
            push({ type: 'success', message: successMessage })
            await loadTickets(activeQueueId)
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Action failed',
            })
        } finally {
            setActing(null)
        }
    }

    const callNext = () =>
        act(
            () => api.post(`/api/staff/queues/${activeQueueId}/next`),
            'Next ticket called',
            'next'
        )

    const serve = (id) =>
        act(
            () => api.post(`/api/staff/tickets/${id}/serve`),
            'Service started',
            `serve-${id}`
        )

    const complete = (id) =>
        act(
            () => api.post(`/api/staff/tickets/${id}/complete`),
            'Service completed',
            `complete-${id}`
        )

    const noShow = (id) =>
        act(
            () => api.post(`/api/staff/tickets/${id}/no-show`),
            'Marked as no-show',
            `noshow-${id}`
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

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
        )
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
                    title="No queues assigned"
                    description="You haven't been assigned to any queues yet. Contact your administrator to get started."
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
                            disabled={!!called || acting === 'next' || isClosed}
                            loading={acting === 'next'}
                            className="!bg-emerald-600 hover:!bg-emerald-700"
                        >
                            {isClosed
                                ? 'Closed'
                                : called
                                    ? 'Currently serving'
                                    : 'Call Next'}
                        </Button>
                        <button
                            onClick={refresh}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {queues.length > 1 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        {queues.map((q) => (
                            <button
                                key={q.id}
                                onClick={() => setActiveQueueId(q.id)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                    activeQueueId === q.id
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                }`}
                            >
                                <Building2 className="h-3 w-3" />
                                {q.name}
                                {q.isOpen === false && <span className="opacity-60">· closed</span>}
                                {q.waitingCount > 0 && (
                                    <span
                                        className={`text-[10px] font-bold ${
                                            activeQueueId === q.id ? 'opacity-80' : 'opacity-60'
                                        }`}
                                    >
                                        {q.waitingCount}
                                    </span>
                                )}
                            </button>
                        ))}
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

                            <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                                Waiting:{' '}
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                    {waiting.length}
                                </span>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {called.status === 'CALLED' && (
                                    <Button
                                        onClick={() => serve(called.id)}
                                        disabled={acting === `serve-${called.id}`}
                                        loading={acting === `serve-${called.id}`}
                                    >
                                        Start Service
                                    </Button>
                                )}
                                {(called.status === 'SERVING' || called.status === 'CALLED') && (
                                    <Button
                                        variant="success"
                                        icon={CheckCircle2}
                                        onClick={() => complete(called.id)}
                                        disabled={acting === `complete-${called.id}`}
                                        loading={acting === `complete-${called.id}`}
                                    >
                                        Complete
                                    </Button>
                                )}
                                <button
                                    onClick={() => noShow(called.id)}
                                    disabled={acting === `noshow-${called.id}`}
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
                            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                Waiting:{' '}
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                    {waiting.length}
                                </span>
                            </div>
                            {waiting.length > 0 && !isClosed && (
                                <button
                                    onClick={callNext}
                                    disabled={acting === 'next'}
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
                    <div className="px-6 py-12 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <ListOrdered className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            No waiting tickets
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {isClosed
                                ? 'This service is closed. New tickets will appear when it reopens.'
                                : 'New tickets will appear here automatically.'}
                        </p>
                    </div>
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
                                    disabled={acting === `noshow-${t.id}`}
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