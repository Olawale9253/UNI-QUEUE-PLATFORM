import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Ticket, MapPin, Clock, ListOrdered, Users,
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
import { useUniversityStore } from '../../store/universityStore'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { useStudentTicketAlerts } from '../../hooks/useNotificationSound'
import { groupQueuesByOffice } from '../../lib/groupQueues'
import { withAlpha } from '../../lib/colors'
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
    const copy = async (event) => {
        event.stopPropagation()
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
    const { university } = useUniversityStore()
    const { push } = useToastStore()
    const navigate = useNavigate()
    const { checkTicket } = useStudentTicketAlerts()

    const [queues, setQueues] = useState([])
    const [activeTicket, setActiveTicket] = useState(null)
    const [history, setHistory] = useState([])
    const [workflows, setWorkflows] = useState([])
    const [availableWorkflows, setAvailableWorkflows] = useState([])
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
    const primaryColor = university?.primaryColor || '#4f46e5'

    const lastLocalActionAtRef = useRef(0)

    const load = useCallback(async () => {
        try {
            const [queue, token, item, aw, itemValue, cd] = await Promise.all([
                api.get('/api/queues'),
                api.get('/api/user/tickets/active'),
                api.get('/api/user/workflows').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/workflows/available').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/tickets/history').catch(() => ({ data: { data: [] } })),
                api.get('/api/closed-dates').catch(() => ({ data: { data: null } })),
            ])
            setQueues(queue.data.data || [])
            setActiveTicket(token.data.data || null)
            setWorkflows(item.data.data || [])
            setAvailableWorkflows(aw.data.data || [])
            setHistory(itemValue.data.data || [])
            setClosedDates(cd.data?.data || { todayClosed: false, todayReason: null, upcoming: [] })
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 30000 })

    useEffect(() => {
        const unsub = syncBus.subscribe('data-changed', (payload) => {
            if (payload?.source === 'student-queue') return
            if (Date.now() - lastLocalActionAtRef.current < 2000) return
            load()
        })
        return unsub
    }, [load])

    const activeWorkflow = workflows.find((workflow) => workflow.status === 'IN_PROGRESS')

    const workflowByQueueId = useMemo(() => {
        const map = new Map()

        const ingest = (item) => {
            const steps = item.steps || []
            const total = item.totalSteps || steps.length || 0
            steps.forEach((step) => {
                if (!step.queueId) return
                if (map.has(step.queueId)) return
                map.set(step.queueId, {
                    workflowId: item.workflowId ?? item.id,
                    workflowName: item.workflowName ?? item.name ?? 'Clearance',
                    stepOrder: step.order ?? step.stepOrder,
                    totalSteps: total,
                })
            })
        }

        workflows.forEach(ingest)
        availableWorkflows.forEach(ingest)
        return map
    }, [workflows, availableWorkflows])

    const lockedQueueIds = useMemo(() => {
        const set = new Set()
        if (activeWorkflow) {
            activeWorkflow.steps.forEach((item) => {
                if (item.state === 'LOCKED') set.add(item.queueId)
            })
        }
        return set
    }, [activeWorkflow])

    const officeGroups = useMemo(() => {
        const groups = groupQueuesByOffice(queues)
        return groups.map((group) => ({
            ...group,
            officeId: group.queues[0]?.officeId ?? null,
        }))
    }, [queues])

    useEffect(() => {
        if (!selectedOfficeId && officeGroups.length > 0) {
            setSelectedOfficeId(String(officeGroups[0].officeId ?? officeGroups[0].key))
        }
    }, [officeGroups, selectedOfficeId])

    const activeOfficeGroup = officeGroups.find(
        (officeGroup) => String(officeGroup.officeId ?? officeGroup.key) === String(selectedOfficeId)
    )
    const servicesInOffice = activeOfficeGroup?.queues ?? []

    const selectedService = servicesInOffice.find(
        (item) => String(item.id) === String(selectedServiceId)
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

        const finished = (history || []).find((itemValue) => itemValue.id === prev.id)

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
            lastLocalActionAtRef.current = Date.now()
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
            lastLocalActionAtRef.current = Date.now()
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
            lastLocalActionAtRef.current = Date.now()
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
            lastLocalActionAtRef.current = Date.now()
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
            (token) => !activeTicket || token.id !== activeTicket.id
        )
        list.push(...recent)

        let sorted = list.sort((leftValue, rightValue) => {
            const at = leftValue.joinedAt ? new Date(leftValue.joinedAt).getTime() : 0
            const bt = rightValue.joinedAt ? new Date(rightValue.joinedAt).getTime() : 0
            return bt - at
        })

        if (statusFilter !== 'ALL') {
            sorted = sorted.filter((itemValue) => itemValue.status === statusFilter)
        }

        if (ticketSearch.trim()) {
            const stringValue = ticketSearch.trim().toLowerCase()
            sorted = sorted.filter((itemValue) => (itemValue.ticketNumber || '').toLowerCase().includes(stringValue))
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
                    className="mb-6 flex items-start gap-3 rounded-xl border p-4"
                    style={{
                        backgroundColor: withAlpha(primaryColor, 0.08),
                        borderColor: withAlpha(primaryColor, 0.28),
                    }}
                >
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-sm">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                            You're registered as a fresher
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            Some services require a matric number. Once you receive yours,
                            update your profile to unlock everything.
                        </p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: primaryColor }}
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
                    className="mb-6 overflow-hidden rounded-xl border"
                    style={{
                        backgroundColor: withAlpha(primaryColor, 0.06),
                        borderColor: withAlpha(primaryColor, 0.25),
                    }}
                >
                    <div className="p-5 sm:p-6">
                        <div className="mb-4 flex items-start gap-3">
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: withAlpha(primaryColor, 0.18) }}
                            >
                                <RouteIcon
                                    className="h-5 w-5"
                                    style={{ color: primaryColor }}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    You're completing: {activeWorkflow.workflowName}
                                </h3>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    This is a required {activeWorkflow.totalSteps}-step clearance.
                                    Complete each step in order.
                                </p>
                            </div>
                        </div>
                        <ol className="space-y-2">
                            {activeWorkflow.steps.map((step, idx) => (
                                <li
                                    key={step.order}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                                        step.state === 'CURRENT'
                                            ? 'bg-white/70 font-medium text-slate-900 dark:bg-slate-900/60 dark:text-slate-100'
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
                                                    ? 'text-white'
                                                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                                        }`}
                                        style={
                                            step.state === 'CURRENT'
                                                ? { backgroundColor: primaryColor }
                                                : undefined
                                        }
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
                                        <span
                                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase text-white"
                                            style={{ backgroundColor: primaryColor }}
                                        >
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
                                        onChange={(event) => setSelectedOfficeId(event.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        {officeGroups.map((officeGroupValue) => (
                                            <option key={officeGroupValue.key} value={String(officeGroupValue.officeId ?? officeGroupValue.key)}>
                                                {officeGroupValue.label} ({officeGroupValue.queues.length})
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
                                        onChange={(eventValue) => setSelectedServiceId(eventValue.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">Select Service</option>
                                        {servicesInOffice.map((itemValue) => {
                                            const isLocked = lockedQueueIds.has(itemValue.id)
                                            const matricLocked = isFresher && itemValue.matricRequired
                                            const closed = itemValue.isOpen === false
                                            const suffix = isLocked
                                                ? ' (locked)'
                                                : matricLocked
                                                    ? ' (matric required)'
                                                    : closed
                                                        ? ' (closed)'
                                                        : ''
                                            return (
                                                <option key={itemValue.id} value={itemValue.id} disabled={isLocked || matricLocked}>
                                                    {itemValue.name}{suffix}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>

                                {selectedService && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-xl border p-4"
                                        style={{
                                            borderColor: withAlpha(primaryColor, 0.28),
                                            backgroundColor: withAlpha(primaryColor, 0.06),
                                        }}
                                    >
                                        {workflowByQueueId.has(selectedService.id) && (
                                            <div
                                                className="mb-3 flex items-start gap-2 rounded-lg border bg-white/80 px-3 py-2 dark:bg-slate-900/70"
                                                style={{ borderColor: withAlpha(primaryColor, 0.25) }}
                                            >
                                                <RouteIcon
                                                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                                    style={{ color: primaryColor }}
                                                />
                                                <div className="min-w-0">
                                                    <div
                                                        className="text-[11px] font-bold uppercase tracking-wider"
                                                        style={{ color: primaryColor }}
                                                    >
                                                        Part of {workflowByQueueId.get(selectedService.id).workflowName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        Step {workflowByQueueId.get(selectedService.id).stepOrder} of{' '}
                                                        {workflowByQueueId.get(selectedService.id).totalSteps}
                                                        {' '}· joining here alone won't start the workflow
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-lg bg-white/70 p-3 shadow-sm dark:bg-slate-800/60">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <Users className="h-3 w-3" />
                                                    Waiting
                                                </div>
                                                <div
                                                    className="mt-1 text-2xl font-bold"
                                                    style={{ color: primaryColor }}
                                                >
                                                    {selectedService.waitingCount ?? 0}
                                                </div>
                                            </div>
                                            <div className="rounded-lg bg-white/70 p-3 shadow-sm dark:bg-slate-800/60">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <Clock className="h-3 w-3" />
                                                    Est. wait
                                                </div>
                                                <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                    {selectedService.estimatedMinutes ?? 0}
                                                    <span className="ml-0.5 text-sm font-semibold">min</span>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedService.location && (
                                            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <MapPin className="h-3 w-3" />
                                                {selectedService.location}
                                            </div>
                                        )}

                                        {selectedService.currentlyServing && (
                                            <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
                                                <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                                    Now serving
                                                </span>
                                                <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
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
                                    style={{ backgroundColor: primaryColor }}
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
                                    onChange={(eventValue2) => setTicketSearch(eventValue2.target.value)}
                                    placeholder="Search ticket ID"
                                    className="w-40 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(eventValue3) => setStatusFilter(eventValue3.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                {STATUS_FILTERS.map((itemValue2) => (
                                    <option key={itemValue2.value} value={itemValue2.value}>
                                        {itemValue2.label}
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
                                {ticketList.slice(0, 20).map((token) => {
                                    const isActive = token._isActive
                                    const isActionable = token.status === 'WAITING' || token.status === 'CALLED'
                                    return (
                                        <motion.li
                                            key={token.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`rounded-lg border p-4 transition-colors ${
                                                isActive
                                                    ? 'bg-white dark:bg-slate-900'
                                                    : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                            style={
                                                isActive
                                                    ? {
                                                        borderColor: withAlpha(primaryColor, 0.4),
                                                        backgroundColor: withAlpha(primaryColor, 0.05),
                                                    }
                                                    : undefined
                                            }
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                                                        {token.queueName || token.officeName || 'Service'}
                                                    </h4>
                                                </div>
                                                <Badge variant={STATUS_VARIANTS[token.status] || 'default'}>
                                                    {STATUS_LABELS[token.status] || token.status}
                                                </Badge>
                                            </div>

                                            <div className="mt-2 flex items-center gap-1.5 text-sm">
                                                <span className="text-slate-500 dark:text-slate-400">Ticket:</span>
                                                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                                                    {token.ticketNumber}
                                                </span>
                                                <CopyButton text={token.ticketNumber} />
                                            </div>

                                            {token.position != null && (
                                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="text-slate-500">Position:</span>{' '}
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {token.position}
                                                    </span>
                                                </div>
                                            )}

                                            {token.estimatedMinutesRemaining != null && (
                                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="text-slate-500">Est. Wait:</span>{' '}
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {token.estimatedMinutesRemaining} min
                                                    </span>
                                                </div>
                                            )}

                                            {isActive && isActionable && (
                                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-3 text-xs dark:border-slate-700">
                                                    <button
                                                        onClick={() => rescheduleTurn(token)}
                                                        disabled={acting === `reschedule-${token.id}`}
                                                        className="font-medium transition-colors disabled:opacity-50"
                                                        style={{ color: primaryColor }}
                                                    >
                                                        {acting === `reschedule-${token.id}` ? 'Rescheduling…' : 'Reschedule turn'}
                                                    </button>
                                                    <button
                                                        onClick={() => skipTurn(token)}
                                                        disabled={acting === `skip-${token.id}`}
                                                        className="font-medium text-rose-600 transition-colors hover:text-rose-700 disabled:opacity-50 dark:text-rose-400"
                                                    >
                                                        {acting === `skip-${token.id}` ? 'Skipping…' : 'Skip'}
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
                                                    {token.status === 'SERVING'
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