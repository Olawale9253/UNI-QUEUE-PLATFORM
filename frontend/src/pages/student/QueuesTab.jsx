import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Ticket, MapPin, Clock, ListOrdered, X, Users,
    CheckCircle2, Lock, ArrowRight, Route as RouteIcon, Building2,
    GraduationCap, Search, Copy, Check,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EnablePushPrompt from '../../components/student/EnablePushPrompt'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { useStudentTicketAlerts } from '../../hooks/useNotificationSound'
import { groupQueuesByOffice } from '../../lib/groupQueues'
import { syncBus } from '../../lib/syncBus'

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

const STATUS_FILTERS = [
    { value: 'ALL', label: 'All statuses' },
    { value: 'WAITING', label: 'Waiting' },
    { value: 'CALLED', label: 'Called' },
    { value: 'SERVING', label: 'Serving' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'NO_SHOW', label: 'No-show' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'WAITLISTED', label: 'Waitlisted' },
    { value: 'TRANSFERRED', label: 'Transferred' },
]

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false)
    const copy = async (e) => {
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {}
    }
    return (
        <button
            type="button"
            onClick={copy}
            title="Copy ticket ID"
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    )
}

export default function QueuesTab() {
    const { user } = useAuthStore()
    const { push } = useToastStore()
    const navigate = useNavigate()
    const { checkTicket } = useStudentTicketAlerts()

    const [queues, setQueues] = useState([])
    const [activeTicket, setActiveTicket] = useState(null)
    const [history, setHistory] = useState([])
    const [workflows, setWorkflows] = useState([])
    const [closedDates, setClosedDates] = useState({
        todayClosed: false,
        todayReason: null,
        upcoming: [],
    })
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [confirmLeave, setConfirmLeave] = useState(false)
    const [leaving, setLeaving] = useState(false)
    const [acting, setActing] = useState(null)

    const [selectedOfficeId, setSelectedOfficeId] = useState('')
    const [selectedServiceId, setSelectedServiceId] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [ticketSearch, setTicketSearch] = useState('')

    const isFresher = user?.role === 'FRESHER'
    const showPushPrompt = !!activeTicket

    const load = useCallback(async () => {
        try {
            const [q, t, w, h, cd] = await Promise.all([
                api.get('/api/queues'),
                api.get('/api/user/tickets/active'),
                api.get('/api/user/workflows').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/tickets/history').catch(() => ({ data: { data: [] } })),
                api.get('/api/closed-dates').catch(() => ({ data: { data: null } })),
            ])
            setQueues(q.data.data || [])
            setActiveTicket(t.data.data || null)
            setWorkflows(w.data.data || [])
            setHistory(h.data.data || [])
            setClosedDates(cd.data?.data || { todayClosed: false, todayReason: null, upcoming: [] })
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 30000 })

    // Refetch when another tab (staff page) makes a change
    useEffect(() => {
        const unsub = syncBus.subscribe('data-changed', (payload) => {
            if (payload?.source === 'student-queue') return
            load()
        })
        return unsub
    }, [load])

    const activeWorkflow = workflows.find((w) => w.status === 'IN_PROGRESS')
    const lockedQueueIds = useMemo(() => {
        const m = new Set()
        if (activeWorkflow) {
            activeWorkflow.steps.forEach((s) => {
                if (s.state === 'LOCKED') m.add(s.queueId)
            })
        }
        return m
    }, [activeWorkflow])

    const officeGroups = useMemo(() => {
        const groups = groupQueuesByOffice(queues)
        return groups.map((g) => ({
            ...g,
            officeId: g.queues[0]?.officeId ?? null,
        }))
    }, [queues])

    useEffect(() => {
        if (!selectedOfficeId && officeGroups.length > 0) {
            setSelectedOfficeId(String(officeGroups[0].officeId ?? officeGroups[0].key))
        }
    }, [officeGroups, selectedOfficeId])

    const activeOfficeGroup = officeGroups.find(
        (g) => String(g.officeId ?? g.key) === String(selectedOfficeId)
    )
    const servicesInOffice = activeOfficeGroup?.queues ?? []

    const selectedService = servicesInOffice.find(
        (q) => String(q.id) === String(selectedServiceId)
    )

    useEffect(() => { setSelectedServiceId('') }, [selectedOfficeId])

    const lastActiveTicketRef = useRef(null)

    useEffect(() => {
        if (activeTicket) {
            lastActiveTicketRef.current = {
                id: activeTicket.id,
                status: activeTicket.status,
            }
            const event = checkTicket(activeTicket)
            if (event) {
                push({ type: event.severity, message: event.message })
            }
            return
        }

        const prev = lastActiveTicketRef.current
        if (!prev) return

        const finished = (history || []).find((h) => h.id === prev.id)

        if (finished && finished.status !== prev.status) {
            const event = checkTicket(finished)
            if (event) {
                push({ type: event.severity, message: event.message })
            }
        }

        lastActiveTicketRef.current = null
    }, [activeTicket, history, checkTicket, push])

    const joinQueue = async () => {
        if (!selectedService) {
            push({ type: 'error', message: 'Select a service to join' })
            return
        }
        if (lockedQueueIds.has(selectedService.id)) {
            push({ type: 'error', message: 'This service is locked by your workflow' })
            return
        }
        if (isFresher && selectedService.matricRequired) {
            push({ type: 'error', message: 'This service requires a matric number' })
            return
        }
        setJoining(true)
        try {
            const res = await api.post('/api/user/tickets/join', { queueId: selectedService.id })
            syncBus.publish('data-changed', { source: 'student-queue', at: Date.now() })
            push({ type: 'success', message: `Joined. Ticket: ${res.data.data.ticketNumber}` })
            setSelectedServiceId('')
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to join' })
        } finally {
            setJoining(false)
        }
    }

    const leaveQueue = async () => {
        if (!activeTicket) return
        setLeaving(true)
        try {
            await api.delete(`/api/user/tickets/${activeTicket.id}`)
            syncBus.publish('data-changed', { source: 'student-queue', at: Date.now() })
            push({ type: 'success', message: 'You left the queue' })
            setConfirmLeave(false)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to leave' })
        } finally {
            setLeaving(false)
        }
    }

    const rescheduleTurn = async (ticket) => {
        setActing(`reschedule-${ticket.id}`)
        try {
            await api.post(`/api/user/tickets/${ticket.id}/reschedule`)
            syncBus.publish('data-changed', { source: 'student-queue', at: Date.now() })
            push({ type: 'success', message: 'Turn rescheduled. You are now at the end of the queue.' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Reschedule not available yet' })
        } finally {
            setActing(null)
        }
    }

    const skipTurn = async (ticket) => {
        setActing(`skip-${ticket.id}`)
        try {
            await api.post(`/api/user/tickets/${ticket.id}/skip`)
            syncBus.publish('data-changed', { source: 'student-queue', at: Date.now() })
            push({ type: 'success', message: 'Turn skipped' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Skip not available yet' })
        } finally {
            setActing(null)
        }
    }

    const ticketList = useMemo(() => {
        const list = []
        if (activeTicket) list.push({ ...activeTicket, _isActive: true })
        const recent = (history || []).filter(
            (t) => !activeTicket || t.id !== activeTicket.id
        )
        list.push(...recent)

        let sorted = list.sort((a, b) => {
            const at = a.joinedAt ? new Date(a.joinedAt).getTime() : 0
            const bt = b.joinedAt ? new Date(b.joinedAt).getTime() : 0
            return bt - at
        })

        if (statusFilter !== 'ALL') {
            sorted = sorted.filter((t) => t.status === statusFilter)
        }

        if (ticketSearch.trim()) {
            const s = ticketSearch.trim().toLowerCase()
            sorted = sorted.filter((t) => (t.ticketNumber || '').toLowerCase().includes(s))
        }

        return sorted
    }, [activeTicket, history, statusFilter, ticketSearch])

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
                <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
        )
    }

    return (
        <div>
            <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Queue Management
                </h2>
            </div>

            {showPushPrompt && <EnablePushPrompt className="mb-6" />}

            {isFresher && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
                >
                    <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                    <div className="flex-1 text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-200">
                            You're registered as a fresher
                        </p>
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                            Some services require a matric number. Once you receive yours,
                            update your profile to unlock everything.
                        </p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
                        >
                            Go to profile
                            <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                </motion.div>
            )}

            {activeWorkflow && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-900 dark:from-amber-950/30 dark:to-orange-950/20"
                >
                    <div className="p-5 sm:p-6">
                        <div className="mb-4 flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
                                <RouteIcon className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                    You're completing: {activeWorkflow.workflowName}
                                </h3>
                                <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                                    This is a required {activeWorkflow.totalSteps}-step clearance. Complete each step in order.
                                </p>
                            </div>
                        </div>
                        <ol className="space-y-2">
                            {activeWorkflow.steps.map((step, idx) => (
                                <li
                                    key={step.order}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                                        step.state === 'CURRENT'
                                            ? 'bg-amber-100/80 font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                                            : step.state === 'COMPLETED'
                                                ? 'text-emerald-700 dark:text-emerald-400'
                                                : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    <div
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                            step.state === 'COMPLETED'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                : step.state === 'CURRENT'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
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
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[360px_1fr]">
                <div className="lg:sticky lg:top-[150px]">
                    <Card className="h-fit">
                        <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                            Join Queue
                        </h3>

                        {queues.length === 0 ? (
                            <EmptyState
                                icon={Ticket}
                                title="No services available"
                                description="Your university hasn't opened any services yet."
                            />
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Office
                                    </label>
                                    <select
                                        value={selectedOfficeId}
                                        onChange={(e) => setSelectedOfficeId(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        {officeGroups.map((g) => (
                                            <option key={g.key} value={String(g.officeId ?? g.key)}>
                                                {g.label} ({g.queues.length})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Service
                                    </label>
                                    <select
                                        value={selectedServiceId}
                                        onChange={(e) => setSelectedServiceId(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">Select Service</option>
                                        {servicesInOffice.map((q) => {
                                            const isLocked = lockedQueueIds.has(q.id)
                                            const matricLocked = isFresher && q.matricRequired
                                            const closed = q.isOpen === false
                                            const suffix = isLocked
                                                ? ' (locked)'
                                                : matricLocked
                                                    ? ' (matric required)'
                                                    : closed
                                                        ? ' (closed)'
                                                        : ''
                                            return (
                                                <option key={q.id} value={q.id} disabled={isLocked || matricLocked}>
                                                    {q.name}{suffix}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>

                                {selectedService && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/50"
                                    >
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            {selectedService.location && (
                                                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                    <MapPin className="h-3 w-3" />
                                                    {selectedService.location}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400">
                                                <Users className="h-3 w-3" />
                                                {selectedService.waitingCount ?? 0} waiting
                                            </span>
                                            <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                                <Clock className="h-3 w-3" />
                                                ~{selectedService.estimatedMinutes ?? 0} min
                                            </span>
                                        </div>
                                        {selectedService.currentlyServing && (
                                            <div className="mt-2 text-slate-600 dark:text-slate-400">
                                                Now serving:{' '}
                                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    {selectedService.currentlyServing}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {selectedService && selectedService.isOpen === false && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                                        {closedDates.todayClosed ? (
                                            <>
                                                This service is closed today
                                                {closedDates.todayReason && (
                                                    <> for <strong>{closedDates.todayReason}</strong></>
                                                )}
                                                {' '}— it reopens on the next working day.
                                            </>
                                        ) : (
                                            <>
                                                This service is closed
                                                {selectedService.opensAt && (
                                                    <>
                                                        {' '}— it reopens at{' '}
                                                        <strong>{String(selectedService.opensAt).slice(0, 5)}</strong>
                                                    </>
                                                )}
                                                .
                                            </>
                                        )}
                                    </div>
                                )}

                                <Button
                                    onClick={joinQueue}
                                    disabled={
                                        !selectedService ||
                                        !!activeTicket ||
                                        joining ||
                                        selectedService?.isOpen === false
                                    }
                                    loading={joining}
                                    fullWidth
                                    className="!mt-4"
                                >
                                    {activeTicket
                                        ? 'Queue turn is near'
                                        : selectedService?.isOpen === false
                                            ? 'Closed'
                                            : joining
                                                ? 'Joining…'
                                                : 'Join Queue'}
                                </Button>

                                {activeTicket && (
                                    <p className="text-center text-xs text-amber-600 dark:text-amber-400">
                                        Complete your current queue turn before joining another queue.
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                <Card>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            My Queue Tickets
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={ticketSearch}
                                    onChange={(e) => setTicketSearch(e.target.value)}
                                    placeholder="Search ticket ID"
                                    className="w-40 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                {STATUS_FILTERS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {ticketList.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <Ticket className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {ticketSearch.trim()
                                    ? 'No tickets match your search'
                                    : statusFilter === 'ALL'
                                        ? 'No queue tickets yet'
                                        : `No ${STATUS_LABELS[statusFilter]?.toLowerCase() || ''} tickets`}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {ticketSearch.trim()
                                    ? 'Check the ticket ID and try again.'
                                    : statusFilter === 'ALL'
                                        ? 'Join a service from the left to get started.'
                                        : 'Try a different filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[600px] overflow-y-auto pr-1">
                            <ul className="space-y-3">
                                {ticketList.slice(0, 20).map((t) => {
                                    const isActive = t._isActive
                                    const isActionable = t.status === 'WAITING' || t.status === 'CALLED'
                                    return (
                                        <motion.li
                                            key={t.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`rounded-lg border p-4 transition-colors ${
                                                isActive
                                                    ? 'border-brand-200 bg-gradient-to-br from-brand-50/60 to-white dark:border-brand-900 dark:from-brand-950/30 dark:to-slate-900'
                                                    : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                                                        {t.queueName || t.officeName || 'Service'}
                                                    </h4>
                                                </div>
                                                <Badge variant={STATUS_VARIANTS[t.status] || 'default'}>
                                                    {STATUS_LABELS[t.status] || t.status}
                                                </Badge>
                                            </div>

                                            <div className="mt-2 flex items-center gap-1.5 text-sm">
                                                <span className="text-slate-500 dark:text-slate-400">Ticket:</span>
                                                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                                                    {t.ticketNumber}
                                                </span>
                                                <CopyButton text={t.ticketNumber} />
                                            </div>

                                            {t.position != null && (
                                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="text-slate-500">Position:</span>{' '}
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {t.position}
                                                    </span>
                                                </div>
                                            )}

                                            {t.estimatedMinutesRemaining != null && (
                                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="text-slate-500">Est. Wait:</span>{' '}
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {t.estimatedMinutesRemaining} min
                                                    </span>
                                                </div>
                                            )}

                                            {isActive && isActionable && (
                                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-3 text-xs dark:border-slate-700">
                                                    <button
                                                        onClick={() => rescheduleTurn(t)}
                                                        disabled={acting === `reschedule-${t.id}`}
                                                        className="font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-50 dark:text-brand-400"
                                                    >
                                                        {acting === `reschedule-${t.id}` ? 'Rescheduling…' : 'Reschedule turn'}
                                                    </button>
                                                    <button
                                                        onClick={() => skipTurn(t)}
                                                        disabled={acting === `skip-${t.id}`}
                                                        className="font-medium text-rose-600 transition-colors hover:text-rose-700 disabled:opacity-50 dark:text-rose-400"
                                                    >
                                                        {acting === `skip-${t.id}` ? 'Skipping…' : 'Skip'}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmLeave(true)}
                                                        className="font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                                                    >
                                                        Leave queue
                                                    </button>
                                                </div>
                                            )}

                                            {isActive && !isActionable && (
                                                <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                                    {t.status === 'SERVING'
                                                        ? 'You are being served.'
                                                        : 'No actions available for this ticket.'}
                                                </div>
                                            )}
                                        </motion.li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </Card>
            </div>

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