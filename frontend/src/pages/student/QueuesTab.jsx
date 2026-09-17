import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Ticket,
    MapPin,
    Clock,
    ListOrdered,
    X,
    Users,
    Info,
    CheckCircle2,
    Lock,
    ArrowRight,
    Route as RouteIcon,
    Building2,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { groupQueuesByDepartment } from '../../lib/groupQueues'
import { ease, stagger, staggerItem } from '../../lib/motion'

export default function QueuesTab() {
    const { user } = useAuthStore()
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [activeTicket, setActiveTicket] = useState(null)
    const [workflows, setWorkflows] = useState([])
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(null)
    const [confirmLeave, setConfirmLeave] = useState(false)
    const [leaving, setLeaving] = useState(false)

    const load = useCallback(async () => {
        try {
            const [q, t, w] = await Promise.all([
                api.get('/api/queues'),
                api.get('/api/user/tickets/active'),
                api.get('/api/user/workflows').catch(() => ({ data: { data: [] } })),
            ])
            setQueues(q.data.data || [])
            setActiveTicket(t.data.data || null)
            setWorkflows(w.data.data || [])
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    useAdaptivePoll(load, { fastMs: 5000, slowMs: 30000 })

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

    const activeWorkflow = workflows.find((w) => w.status === 'IN_PROGRESS')
    const lockedQueueIds = new Map()
    const currentStepQueueId = activeWorkflow?.currentQueueId || null

    if (activeWorkflow) {
        activeWorkflow.steps.forEach((s) => {
            if (s.state === 'LOCKED') lockedQueueIds.set(s.queueId, s)
        })
    }

    const isQueueLocked = (queueId) => lockedQueueIds.has(queueId)
    const isQueueCurrent = (queueId) => queueId === currentStepQueueId

    const groups = groupQueuesByDepartment(queues)

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
                        className="relative mb-6 overflow-hidden rounded-xl border border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-lg sm:p-8"
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
                      Position {activeTicket.position} of the queue
                    </span>
                                    )}
                                    {activeTicket.estimatedMinutesRemaining != null && (
                                        <span className="flex items-center gap-1.5 text-white/90">
                      <Clock className="h-4 w-4" />
                      Est. wait ~{activeTicket.estimatedMinutesRemaining} min
                    </span>
                                    )}
                                </div>
                                <div className="mt-4 flex items-start gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/90 backdrop-blur">
                                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>
                    {activeTicket.status === 'WAITING'
                        ? "Keep this page open or check back — you'll be notified when it's your turn. Head to the service point when your position reaches 1."
                        : activeTicket.status === 'CALLED'
                            ? "It's your turn! Proceed to the service point now."
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

            {activeWorkflow && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
                >
                    <div className="p-5 sm:p-6">
                        <div className="mb-4 flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                <RouteIcon className="h-5 w-5 text-amber-700" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-amber-900">
                                    You're completing: {activeWorkflow.workflowName}
                                </h3>
                                <p className="mt-1 text-xs text-amber-800">
                                    This is a required {activeWorkflow.totalSteps}-step clearance. You must
                                    complete each step in order. Only the{' '}
                                    <strong>current step's queue</strong> can be joined until you finish.
                                </p>
                            </div>
                        </div>

                        <ol className="space-y-2">
                            {activeWorkflow.steps.map((step, idx) => (
                                <li
                                    key={step.order}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                                        step.state === 'CURRENT'
                                            ? 'bg-amber-100/80 font-medium text-amber-900'
                                            : step.state === 'COMPLETED'
                                                ? 'text-emerald-700'
                                                : 'text-slate-500'
                                    }`}
                                >
                                    <div
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                            step.state === 'COMPLETED'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : step.state === 'CURRENT'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-slate-200 text-slate-500'
                                        }`}
                                    >
                                        {step.state === 'COMPLETED' ? (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        ) : step.state === 'CURRENT' ? (
                                            idx + 1
                                        ) : (
                                            <Lock className="h-3 w-3" />
                                        )}
                                    </div>
                                    <span className="flex-1">
                    <span className="font-medium">{step.queueName}</span>
                                        {step.label && ` · ${step.label}`}
                  </span>
                                    {step.state === 'CURRENT' && (
                                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      Current
                    </span>
                                    )}
                                </li>
                            ))}
                        </ol>

                        <div className="mt-4 flex items-start gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-amber-900">
                            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                Join the <strong>{activeWorkflow.currentQueueName}</strong> queue below
                to continue. The other queues are locked until you complete this step.
              </span>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Available queues</h3>
                <p className="mt-1 text-xs text-slate-500">
                    {activeWorkflow
                        ? `Locked queues are part of your active workflow. Complete the current step first.`
                        : `Pick a queue below to join. When you join, you get a ticket number like B-001 — the letter is the queue's initial, the number is your place in line for today.`}
                </p>
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
                <div className="space-y-8">
                    {groups.map((group, groupIdx) => (
                        <motion.section
                            key={group.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: groupIdx * 0.05 }}
                        >
                            {/* Department header */}
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-brand-600" />
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                                        {group.label}
                                    </h4>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {group.queues.length}{' '}
                                        {group.queues.length === 1 ? 'queue' : 'queues'}
                  </span>
                                </div>
                                {group.waitingTotal > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Users className="h-3 w-3" />
                                        {group.waitingTotal} waiting
                  </span>
                                )}
                            </div>

                            {/* Queues in this department */}
                            <motion.div
                                variants={stagger(0, 0.04)}
                                initial="initial"
                                animate="animate"
                                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                            >
                                {group.queues.map((q) => {
                                    const locked = isQueueLocked(q.id)
                                    const current = isQueueCurrent(q.id)

                                    return (
                                        <motion.div
                                            key={q.id}
                                            variants={staggerItem}
                                            whileHover={!locked ? { y: -3 } : {}}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Card
                                                className={`relative flex h-full flex-col ${
                                                    locked
                                                        ? 'border-slate-200 bg-slate-50 opacity-75'
                                                        : current
                                                            ? 'border-amber-300 ring-2 ring-amber-200'
                                                            : ''
                                                }`}
                                            >
                                                {locked && (
                                                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                                                        <Lock className="h-3 w-3" />
                                                        Locked
                                                    </div>
                                                )}
                                                {current && (
                                                    <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                                                        Your next step
                                                    </div>
                                                )}

                                                <div
                                                    className={`flex items-start justify-between gap-3 ${
                                                        locked || current ? 'pr-24' : ''
                                                    }`}
                                                >
                                                    <div className="min-w-0">
                                                        <h3
                                                            className={`text-base font-semibold ${
                                                                locked ? 'text-slate-500' : 'text-slate-900'
                                                            }`}
                                                        >
                                                            {q.name}
                                                        </h3>
                                                    </div>
                                                </div>

                                                {q.location && (
                                                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {q.location}
                                                    </p>
                                                )}

                                                {q.description && (
                                                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                                                        {q.description}
                                                    </p>
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
                                                            <span className="ml-0.5 text-xs font-normal text-slate-500">
                                m
                              </span>
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

                                                {q.currentlyServing && !locked && (
                                                    <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs">
                                                        <span className="text-slate-600">Now serving: </span>
                                                        <span className="font-mono font-semibold text-brand-700">
                              {q.currentlyServing}
                            </span>
                                                    </div>
                                                )}

                                                <div className="mt-auto pt-5">
                                                    {locked ? (
                                                        <div className="rounded-lg bg-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-500">
                                                            Complete the current step to unlock
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            fullWidth
                                                            onClick={() => joinQueue(q.id)}
                                                            disabled={!!activeTicket || joining === q.id}
                                                            loading={joining === q.id}
                                                        >
                                                            {activeTicket
                                                                ? 'Finish current ticket first'
                                                                : 'Join queue'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </motion.div>
                        </motion.section>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={confirmLeave}
                onClose={() => !leaving && setConfirmLeave(false)}
                onConfirm={leaveQueue}
                title="Leave the queue?"
                description={`You'll lose your current position for ticket ${activeTicket?.ticketNumber}. You can rejoin later, but you'll go to the end of the line.`}
                confirmLabel="Leave queue"
                cancelLabel="Keep my spot"
                variant="danger"
                loading={leaving}
            />
        </div>
    )
}