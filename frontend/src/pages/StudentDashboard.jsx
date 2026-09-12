import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, MapPin, Clock, ListOrdered, X } from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/layout/PageHeader'
import { SkeletonQueueGrid } from '../components/ui/Skeleton'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease, fadeUp, stagger, staggerItem } from '../lib/motion'

export default function StudentDashboard() {
    const { user } = useAuthStore()
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [activeTicket, setActiveTicket] = useState(null)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(null)

    const load = useCallback(async () => {
        try {
            const [q, t] = await Promise.all([
                api.get('/api/queues'),
                api.get('/api/user/tickets/active'),
            ])
            setQueues(q.data.data || [])
            setActiveTicket(t.data.data || null)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load data' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
        const interval = setInterval(load, 15000)
        return () => clearInterval(interval)
    }, [load])

    const joinQueue = async (queueId) => {
        setJoining(queueId)
        try {
            const res = await api.post('/api/user/tickets/join', { queueId })
            push({ type: 'success', message: `Joined queue. Ticket: ${res.data.data.ticketNumber}` })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to join queue' })
        } finally {
            setJoining(null)
        }
    }

    const leaveQueue = async () => {
        if (!activeTicket) return
        try {
            await api.delete(`/api/user/tickets/${activeTicket.id}`)
            push({ type: 'success', message: 'You left the queue' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to leave queue' })
        }
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                title={`Welcome back, ${user?.fullName?.split(' ')[0] || ''}`}
                description="Track your position and join new queues."
            />

            <AnimatePresence mode="wait">
                {activeTicket && (
                    <motion.div
                        key={activeTicket.id}
                        initial={{ opacity: 0, y: -12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.98 }}
                        transition={{ duration: 0.4, ease }}
                        className="relative mb-8 overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8"
                    >
                        {/* Animated shimmer line */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        />

                        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">
                                    Active ticket
                                </p>
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1, ease }}
                                    className="mt-2 font-mono text-4xl font-semibold tracking-tight sm:text-5xl"
                                >
                                    {activeTicket.ticketNumber}
                                </motion.div>
                                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span className="flex items-center gap-1.5 text-indigo-100">
                    <MapPin className="h-4 w-4" />
                      {activeTicket.queueName}
                  </span>
                                    {activeTicket.position && (
                                        <span className="flex items-center gap-1.5 text-indigo-100">
                      <ListOrdered className="h-4 w-4" />
                      Position {activeTicket.position}
                    </span>
                                    )}
                                    {activeTicket.estimatedMinutesRemaining != null && (
                                        <span className="flex items-center gap-1.5 text-indigo-100">
                      <Clock className="h-4 w-4" />
                      ~{activeTicket.estimatedMinutesRemaining} min remaining
                    </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                    {activeTicket.status}
                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={leaveQueue}
                                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                                    icon={X}
                                >
                                    Leave queue
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Available queues</h2>
                <span className="text-xs text-slate-500">Auto-refreshing every 15 seconds</span>
            </div>

            {loading ? (
                <SkeletonQueueGrid count={6} />
            ) : queues.length === 0 ? (
                <EmptyState
                    icon={Ticket}
                    title="No queues available"
                    description="Your university hasn't opened any queues yet. Check back shortly."
                />
            ) : (
                <motion.div
                    variants={stagger(0, 0.05)}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                    {queues.map((q) => (
                        <motion.div
                            key={q.id}
                            variants={staggerItem}
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="flex h-full flex-col">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-base font-semibold text-slate-900">{q.name}</h3>
                                    {q.allowWaitlist && <Badge variant="info">Waitlist</Badge>}
                                </div>

                                {q.location && (
                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {q.location}
                                    </p>
                                )}

                                {q.description && (
                                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                                        {q.description}
                                    </p>
                                )}

                                <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    ~{q.averageServiceMinutes} min/ticket
                  </span>
                                    <span className="flex items-center gap-1.5">
                    <ListOrdered className="h-3.5 w-3.5" />
                    Cap. {q.maxCapacity}
                  </span>
                                </div>

                                <div className="mt-5">
                                    <Button
                                        fullWidth
                                        onClick={() => joinQueue(q.id)}
                                        disabled={!!activeTicket || joining === q.id}
                                        loading={joining === q.id}
                                    >
                                        {activeTicket ? 'Finish current ticket' : 'Join queue'}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}