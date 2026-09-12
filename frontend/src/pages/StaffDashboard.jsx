import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, User, CheckCircle2, ListOrdered } from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/layout/PageHeader'
import { SkeletonRow } from '../components/ui/Skeleton'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease, stagger, staggerItem } from '../lib/motion'

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

export default function StaffDashboard() {
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
        const interval = setInterval(() => {
            if (activeQueue) loadTickets(activeQueue.id, false)
        }, 10000)
        return () => clearInterval(interval)
    }, [activeQueue, loadTickets])

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
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 h-12 w-1/3 animate-pulse rounded-lg bg-slate-200" />
                <div className="rounded-xl border border-slate-200 bg-white">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                </div>
            </div>
        )
    }

    if (queues.length === 0) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <PageHeader title="Staff Dashboard" description={`Signed in as ${user?.fullName}`} />
                <EmptyState
                    icon={ListOrdered}
                    title="No queues assigned"
                    description="You haven't been assigned to any queues yet. Contact your administrator."
                />
            </div>
        )
    }

    const called = tickets.find((t) => t.status === 'CALLED' || t.status === 'SERVING')
    const waiting = tickets.filter((t) => t.status === 'WAITING' || t.status === 'WAITLISTED')
    const resolved = tickets.filter((t) =>
        ['COMPLETED', 'NO_SHOW', 'CANCELLED', 'TRANSFERRED'].includes(t.status)
    )

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                title="Staff Dashboard"
                description={`Signed in as ${user?.fullName}`}
                action={
                    <Button
                        onClick={callNext}
                        disabled={!activeQueue || acting === 'next'}
                        loading={acting === 'next'}
                    >
                        Call next ticket
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="lg:col-span-1">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        My queues
                    </h2>
                    <motion.div
                        variants={stagger(0, 0.05)}
                        initial="initial"
                        animate="animate"
                        className="space-y-2"
                    >
                        {queues.map((q) => (
                            <motion.button
                                key={q.id}
                                variants={staggerItem}
                                whileHover={{ x: 2 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => setActiveQueue(q)}
                                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                                    activeQueue?.id === q.id
                                        ? 'border-indigo-300 bg-indigo-50'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div
                                            className={`text-sm font-medium ${
                                                activeQueue?.id === q.id ? 'text-indigo-900' : 'text-slate-900'
                                            }`}
                                        >
                                            {q.name}
                                        </div>
                                        {q.location && (
                                            <div className="mt-0.5 text-xs text-slate-500">{q.location}</div>
                                        )}
                                    </div>
                                    {activeQueue?.id === q.id && (
                                        <motion.div
                                            initial={{ x: -4, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronRight className="h-4 w-4 text-indigo-600" />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>

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
                                <Card className="border-indigo-200 bg-indigo-50/50">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                                            Now serving
                                        </h3>
                                        <Badge variant="indigo">{called.status}</Badge>
                                    </div>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: 0.1 }}
                                                className="font-mono text-3xl font-semibold text-slate-900"
                                            >
                                                {called.ticketNumber}
                                            </motion.div>
                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                            {called.userFullName}
                        </span>
                                                {called.matricNumber && (
                                                    <span className="font-mono text-xs">{called.matricNumber}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {called.status === 'CALLED' && (
                                                <Button
                                                    onClick={() => serve(called.id)}
                                                    disabled={acting === `serve-${called.id}`}
                                                    loading={acting === `serve-${called.id}`}
                                                >
                                                    Start service
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
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Card padded={false}>
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-900">Waiting in queue</h3>
                            <span className="text-xs text-slate-500">
                {waiting.length} ticket{waiting.length === 1 ? '' : 's'}
              </span>
                        </div>

                        {ticketsLoading ? (
                            <div>
                                {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
                            </div>
                        ) : waiting.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-slate-500">
                                No waiting tickets.
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
                                        className="flex items-center justify-between px-6 py-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                                                {t.position ?? i + 1}
                                            </div>
                                            <div>
                                                <div className="font-mono text-sm font-semibold text-slate-900">
                                                    {t.ticketNumber}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {t.userFullName}
                                                    {t.matricNumber ? ` · ${t.matricNumber}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={statusVariant[t.status] || 'default'}>{t.status}</Badge>
                                            <button
                                                onClick={() => noShow(t.id)}
                                                disabled={acting === `noshow-${t.id}`}
                                                className="text-xs text-slate-500 transition-colors hover:text-rose-600"
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
                                <h3 className="text-sm font-semibold text-slate-900">Recently resolved</h3>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {resolved.slice(0, 5).map((t) => (
                                    <li key={t.id} className="flex items-center justify-between px-6 py-3">
                                        <span className="font-mono text-sm text-slate-700">{t.ticketNumber}</span>
                                        <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}