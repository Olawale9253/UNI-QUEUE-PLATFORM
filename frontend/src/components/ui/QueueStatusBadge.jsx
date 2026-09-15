import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, MapPin, Clock, ListOrdered, X, Users, Info } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import QueueStatusBadge from '../../components/ui/QueueStatusBadge'
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { ease, stagger, staggerItem } from '../../lib/motion'

export default function QueuesTab() {
    const { user } = useAuthStore()
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [activeTicket, setActiveTicket] = useState(null)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(null)
    const [confirmLeave, setConfirmLeave] = useState(false)
    const [leaving, setLeaving] = useState(false)

    const load = useCallback(async () => {
        try {
            const [q, t] = await Promise.all([
                api.get('/api/queues'),
                api.get('/api/user/tickets/active'),
            ])
            setQueues(q.data.data || [])
            setActiveTicket(t.data.data || null)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load' })
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
            push({ type: 'success', message: `Joined. Ticket: ${res.data.data.ticketNumber}` })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to join' })
        } finally {
            setJoining(null)
        }
    }

    const leaveQueue = async () => {
        if (!activeTicket) return
        setLeaving(true)
        try {
            await api.delete(`/api/user/tickets/${activeTicket.id}`)
            push({ type: 'success', message: 'You left the queue' })
            setConfirmLeave(false)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to leave' })
        } finally {
            setLeaving(false)
        }
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    Hi, {user?.fullName?.split(' ')[0] || 'there'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Join a queue from anywhere and get notified when it's your turn.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {activeTicket && (
                    <motion.div
                        key={activeTicket.id}
                        initial={{ opacity: 0, y: -12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.98 }}
                        transition={{ duration: 0.4, ease }}
                        className="relative mb-8 overflow-hidden rounded-xl border border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-lg sm:p-8"
                    >
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        />

                        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-white/80">
                                    Your active ticket
                                </p>
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1, ease }}
                                    className="mt-2 font-mono text-4xl font-semibold tracking-tight sm:text-5xl"
                                >
                                    {activeTicket.ticketNumber}
                                </motion.div>
                                <p className="mt-2 text-xs text-white/80">
                                    "{activeTicket.ticketNumber}" = {activeTicket.queueName} ticket #
                                    {activeTicket.ticketNumber.split('-')[1]}
                                </p>
                                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span className="flex items-center gap-1.5 text-white/90">
                    <MapPin className="h-4 w-4" />
                      {activeTicket.queueName}
                  </span>
                                    {activeTicket.position && (
                                        <span className="flex items-center gap-1.5 text-white/90">
                      <ListOrdered className="h-4 w-4" />
                      Position {activeTicket.position}
                    </span>
                                    )}
                                    {activeTicket.estimatedMinutesRemaining != null && (
                                        <span className="flex items-center gap-1.5 text-white/90">
                      <Clock className="h-4 w-4" />
                      ~{activeTicket.estimatedMinutesRemaining} min
                    </span>
                                    )}
                                </div>
                                <div className="mt-4 flex items-start gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/90 backdrop-blur">
                                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>
                    {activeTicket.status === 'WAITING'
                        ? "Keep this page open — you'll be notified when it's your turn."
                        : activeTicket.status === 'CALLED'
                            ? "It's your turn! Proceed to the service point."
                            : activeTicket.status === 'SERVING'
                                ? 'You are being served.'
                                : 'Please wait.'}
                  </span>
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
                                    onClick={() => setConfirmLeave(true)}
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

            <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Available queues</h3>
                <p className="mt-1 text-xs text-slate-500">
                    Pick a queue below to join. You get a ticket number like{' '}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-medium text-slate-700">
            B-001
          </span>
                    .
                </p>
            </div>

            {loading ? (
                <SkeletonQueueGrid count={6} />
            ) : queues.length === 0 ? (
                <EmptyState
                    icon={Ticket}
                    title="No queues available"
                    description="Your university hasn't opened any queues yet."
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
                                    <div className="min-w-0">
                                        <h3 className="text-base font-semibold text-slate-900">{q.name}</h3>
                                        {q.department && (
                                            <p className="mt-0.5 text-xs text-slate-500">{q.department}</p>
                                        )}
                                    </div>
                                    {q.allowWaitlist && <Badge variant="info">Waitlist</Badge>}
                                </div>

                                <div className="mt-2">
                                    <QueueStatusBadge queue={q} />
                                </div>

                                {q.location && (
                                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {q.location}
                                    </p>
                                )}

                                {q.description && (
                                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{q.description}</p>
                                )}

                                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                                    <div>
                                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                            <Users className="h-3 w-3" />
                                            In queue
                                        </div>
                                        <div className="mt-1 text-lg font-semibold text-slate-900">
                                            {q.waitingCount ?? 0}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                            <Clock className="h-3 w-3" />
                                            ~Wait
                                        </div>
                                        <div className="mt-1 text-lg font-semibold text-slate-900">
                                            {q.estimatedMinutes ?? 0}
                                            <span className="ml-0.5 text-xs font-normal text-slate-500">m</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                            <ListOrdered className="h-3 w-3" />
                                            Cap.
                                        </div>
                                        <div className="mt-1 text-lg font-semibold text-slate-900">
                                            {q.maxCapacity}
                                        </div>
                                    </div>
                                </div>

                                {q.currentlyServing && (
                                    <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs">
                                        <span className="text-slate-600">Now serving: </span>
                                        <span className="font-mono font-semibold text-brand-700">
                      {q.currentlyServing}
                    </span>
                                    </div>
                                )}

                                <div className="mt-auto pt-5">
                                    <Button
                                        fullWidth
                                        onClick={() => joinQueue(q.id)}
                                        disabled={!!activeTicket || joining === q.id}
                                        loading={joining === q.id}
                                    >
                                        {activeTicket ? 'Finish current ticket first' : 'Join queue'}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <ConfirmDialog
                open={confirmLeave}
                onClose={() => !leaving && setConfirmLeave(false)}
                onConfirm={leaveQueue}
                title="Leave the queue?"
                description={`You'll lose your current position for ticket ${activeTicket?.ticketNumber}.`}
                confirmLabel="Leave queue"
                cancelLabel="Keep my spot"
                variant="danger"
                loading={leaving}
            />
        </div>
    )
}