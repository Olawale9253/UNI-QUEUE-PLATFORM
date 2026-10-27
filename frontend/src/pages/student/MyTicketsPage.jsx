import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowRight, Check, Clock3, LogOut, Ticket, History,
    RotateCcw, SkipForward, ArrowUpRight, Copy, Star, CheckCircle2
} from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { formatDateTime } from '../../lib/format'
import Card from '../../components/ui/Card'
import RatingModal from '../../components/student/RatingModal' // 👈 Import RatingModal

const QUEUE_STEPS = ['Joined', 'Waiting', 'In Service', 'Completed']

function getActiveStep(status) {
    switch (status?.toUpperCase()) {
        case 'IN_SERVICE':
        case 'SERVING':
            return 2
        case 'COMPLETED':
            return 3
        case 'WAITING':
        case 'ACTIVE':
        default:
            return 1
    }
}

function StatusBadge({ status }) {
    const isComplete = status?.toUpperCase() === 'COMPLETED'
    const isCancelled = status?.toUpperCase() === 'CANCELLED'
    const isNoShow = status?.toUpperCase() === 'NO_SHOW'

    let colorClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
    if (isComplete) colorClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    if (isCancelled || isNoShow) colorClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${colorClass}`}>
            {status?.replaceAll('_', ' ') || 'Active'}
        </span>
    )
}

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

export default function MyTicketsPage() {
    const { push } = useToastStore()
    const navigate = useNavigate()

    const [activeTicket, setActiveTicket] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [acting, setActing] = useState(null)

    // 👇 States for the Rating Modal
    const [ratingTicket, setRatingTicket] = useState(null)
    const shownRatingForTicket = useRef(null) // Prevents popup from showing twice for the same ticket

    const loadData = useCallback(async () => {
        try {
            const [activeRes, historyRes] = await Promise.all([
                api.get('/api/user/tickets/active').catch(() => ({ data: { data: null } })),
                api.get('/api/user/tickets/history').catch(() => ({ data: { data: [] } }))
            ])
            setActiveTicket(activeRes.data?.data || null)
            setHistory(historyRes.data?.data || [])
        } catch {
            // Polling keeps the last successfully loaded data
        } finally {
            setLoading(false)
        }
    }, [])

    useAdaptivePoll(loadData, { fastMs: 5000, slowMs: 15000 })

    // 👇 AUTO-POPUP LOGIC
    useEffect(() => {
        if (activeTicket && activeTicket.status === 'COMPLETED') {
            // Only auto-trigger if we haven't shown it for this ticket yet in this session
            if (shownRatingForTicket.current !== activeTicket.id) {
                setRatingTicket(activeTicket)
                shownRatingForTicket.current = activeTicket.id
            }
        }
    }, [activeTicket])

    const leaveQueue = async () => {
        if (!activeTicket) return
        setActing('leave')
        try {
            await api.post(`/api/user/tickets/${activeTicket.id}/leave`)
            setActiveTicket(null)
            push({ type: 'success', message: 'You have left the queue' })
            loadData()
        } catch (err) {
            push({ type: 'error', message: err.message })
        } finally {
            setActing(null)
        }
    }

    const rescheduleTurn = async () => {
        if (!activeTicket) return
        setActing('reschedule')
        try {
            await api.post(`/api/user/tickets/${activeTicket.id}/reschedule`)
            push({ type: 'success', message: 'Turn rescheduled. You are now at the end of the queue.' })
            loadData()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Reschedule not available yet' })
        } finally {
            setActing(null)
        }
    }

    const skipTurn = async () => {
        if (!activeTicket) return
        setActing('skip')
        try {
            await api.post(`/api/user/tickets/${activeTicket.id}/skip`)
            push({ type: 'success', message: 'Turn skipped' })
            loadData()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Skip not available yet' })
        } finally {
            setActing(null)
        }
    }

    // 👇 Handle successful rating
    const handleRated = (ticketId, rating) => {
        setRatingTicket(null)
        setActiveTicket(null) // Clear it from the active view immediately
        push({ type: 'success', message: 'Thank you for your feedback!' })
        loadData() // Refresh from backend to confirm
    }

    // LIMIT: Only show the most recent 3 past tickets to keep it clean
    const pastTickets = history.filter((ticket) => ticket.status !== 'WAITING').slice(0, 3)

    if (loading && !activeTicket) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
        )
    }

    const position = activeTicket?.position ?? 1
    const activeStep = getActiveStep(activeTicket?.status)
    const isActionable = activeTicket?.status === 'WAITING' || activeTicket?.status === 'CALLED'
    const isCompleted = activeTicket?.status === 'COMPLETED'

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    My Tickets
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Track your live position in line and review your past tickets.
                </p>
            </div>

            {activeTicket ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className={`border-brand-200 dark:border-brand-900/50 ${isCompleted ? 'ring-2 ring-emerald-500/20' : ''}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isCompleted ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'}`}>
                                    {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Ticket className="h-6 w-6" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {activeTicket.queueName || 'Queue'}
                                    </h3>
                                    <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                                        Ticket {activeTicket.ticketNumber || activeTicket.id}
                                    </p>
                                </div>
                            </div>
                            <StatusBadge status={activeTicket.status} />
                        </div>

                        {/* 👇 CONDITIONAL RENDERING: If completed, show rating prompt. Else show position/wait time */}
                        {isCompleted ? (
                            <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-emerald-50/50 p-8 text-center dark:bg-emerald-950/20">
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                                    <Star className="h-7 w-7" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Service Completed</h3>
                                <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                                    Your transaction is complete. How was your experience today?
                                </p>
                                <button
                                    onClick={() => setRatingTicket(activeTicket)}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-700 hover:shadow-lg"
                                >
                                    <Star className="h-4 w-4 fill-white" />
                                    Rate this service
                                </button>
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]">
                                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Your Position</p>
                                    <p className="mt-2 text-5xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">{position}</p>
                                    <p className="mt-1 text-sm font-medium text-slate-500">in queue</p>
                                </div>

                                <div className="flex flex-col justify-center rounded-xl border border-slate-100 p-6 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                        <Clock3 className="h-4 w-4" /> Est. Wait Time
                                    </div>
                                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        ~{activeTicket.estimatedMinutes ?? 10} min
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{Math.max(0, position - 1)}</span> people ahead of you
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 items-center justify-center sm:justify-end">
                                    {isActionable && (
                                        <div className="flex w-full flex-col gap-2">
                                            <button
                                                onClick={rescheduleTurn}
                                                disabled={!!acting}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                {acting === 'reschedule' ? 'Rescheduling...' : 'Reschedule'}
                                            </button>
                                            <button
                                                onClick={skipTurn}
                                                disabled={!!acting}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                                            >
                                                <SkipForward className="h-4 w-4" />
                                                {acting === 'skip' ? 'Skipping...' : 'Skip Turn'}
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        onClick={leaveQueue}
                                        disabled={!!acting}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 disabled:opacity-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {acting === 'leave' ? 'Leaving...' : 'Leave Queue'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div className="mt-8 px-2 sm:px-6 pb-2">
                            <div className="relative flex items-start justify-between">
                                <div className="absolute left-0 right-0 top-3 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                <div
                                    className={`absolute left-0 top-3 h-1 rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-brand-600'}`}
                                    style={{ width: `${(activeStep / (QUEUE_STEPS.length - 1)) * 100}%` }}
                                />
                                {QUEUE_STEPS.map((step, index) => {
                                    const isStepComplete = index < activeStep
                                    const isCurrent = index === activeStep
                                    return (
                                        <div key={step} className="relative z-10 flex w-16 flex-col items-center gap-2 text-center sm:w-24">
                                            <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                                                isStepComplete || isCurrent
                                                    ? isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-brand-600 bg-brand-600 text-white'
                                                    : 'border-slate-300 bg-white text-transparent dark:border-slate-700 dark:bg-slate-900'
                                            }`}>
                                                {isStepComplete ? <Check className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                                            </span>
                                            <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                                isCurrent ? (isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-brand-700 dark:text-brand-300') : 'text-slate-500 dark:text-slate-400'
                                            }`}>
                                                {step}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ) : (
                <Card className="py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <Ticket className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">No active ticket</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                        You are not currently in any queue. Join a service to get started.
                    </p>
                    <Link
                        to="/student/queues"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 shadow-sm"
                    >
                        Join a Service <ArrowRight className="h-4 w-4" />
                    </Link>
                </Card>
            )}

            {/* UPGRADED RECENT TICKETS SECTION */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-slate-400" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Tickets</h2>
                    </div>
                    {pastTickets.length > 0 && (
                        <Link
                            to="/student/history"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                            View full history <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>

                {pastTickets.length === 0 ? (
                    <Card>
                        <p className="px-6 py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                            You have no past tickets yet.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {pastTickets.map((ticket) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                                            {ticket.queueName || ticket.officeName || 'Service'}
                                        </h4>
                                    </div>
                                    <StatusBadge status={ticket.status} />
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium text-slate-500 dark:text-slate-400">Ticket:</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                            {ticket.ticketNumber || ticket.id}
                                        </span>
                                        <CopyButton text={ticket.ticketNumber || String(ticket.id)} />
                                    </div>

                                    {ticket.position != null && (
                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            <span className="text-slate-500">Position:</span>{' '}
                                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                                {ticket.position}
                                            </span>
                                        </div>
                                    )}

                                    {ticket.createdAt && (
                                        <div className="text-xs font-medium text-slate-400">
                                            {formatDateTime(ticket.createdAt)}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* 👇 Rating Modal Render */}
            <AnimatePresence>
                {ratingTicket && (
                    <RatingModal
                        ticket={ratingTicket}
                        onClose={() => setRatingTicket(null)}
                        onRated={handleRated}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}