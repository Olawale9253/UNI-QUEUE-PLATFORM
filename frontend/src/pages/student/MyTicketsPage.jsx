import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Clock3, LogOut, Ticket } from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { formatDateTime } from '../../lib/format'

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

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isComplete
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
        }`}>
            {status?.replaceAll('_', ' ') || 'Active'}
        </span>
    )
}

export default function MyTicketsPage() {
    const { push } = useToastStore()
    const [activeTicket, setActiveTicket] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    const loadData = useCallback(async () => {
        try {
            const [activeRes, historyRes] = await Promise.all([
                api.get('/api/user/tickets/active').catch(() => ({ data: { data: null } })),
                api.get('/api/user/tickets/history').catch(() => ({ data: { data: [] } }))
            ])
            setActiveTicket(activeRes.data?.data || null)
            setHistory(historyRes.data?.data || [])
        } catch {
            // Polling keeps the last successfully loaded ticket data visible.
        } finally {
            setLoading(false)
        }
    }, [])

    useAdaptivePoll(loadData, { fastMs: 5000, slowMs: 15000 })

    const leaveQueue = async () => {
        if (!activeTicket) return
        try {
            await api.post(`/api/user/tickets/${activeTicket.id}/leave`)
            setActiveTicket(null)
            push({ type: 'success', message: 'You have left the queue' })
            loadData()
        } catch (err) {
            push({ type: 'error', message: err.message })
        }
    }

    const pastTickets = history.filter((ticket) => ticket.status !== 'WAITING')

    if (loading && !activeTicket) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Loading your tickets…
            </div>
        )
    }

    const position = activeTicket?.position ?? 1
    const activeStep = getActiveStep(activeTicket?.status)

    return (
        <div className="mx-auto w-full max-w-5xl space-y-4">
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Queue Position</h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    Follow your place in line and review previous tickets.
                </p>
            </div>

            {activeTicket ? (
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                <Ticket className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                                    {activeTicket.queueName || 'Queue'}
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Ticket #{activeTicket.ticketNumber || activeTicket.id}
                                </p>
                            </div>
                        </div>
                        <StatusBadge status={activeTicket.status} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
                        <div className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Your Position</p>
                            <p className="mt-1 text-4xl font-bold leading-none tracking-tight text-slate-900 dark:text-slate-100">{position}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">in queue</p>
                        </div>

                        <div className="flex flex-col justify-center rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <Clock3 className="h-3.5 w-3.5" />
                                Estimated Wait Time
                            </div>
                            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                ~{activeTicket.estimatedMinutes ?? 10} min
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                People ahead: <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.max(0, position - 1)}</span>
                            </p>
                        </div>

                        <div className="flex items-center sm:justify-end">
                            <button
                                onClick={leaveQueue}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 sm:w-auto"
                            >
                                <LogOut className="h-4 w-4" />
                                Leave Queue
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 px-1 sm:px-3" aria-label={`Ticket status: ${QUEUE_STEPS[activeStep]}`}>
                        <div className="relative flex items-start justify-between">
                            <div className="absolute left-0 right-0 top-3 h-0.5 bg-slate-200 dark:bg-slate-700" />
                            <div
                                className="absolute left-0 top-3 h-0.5 bg-brand-600 transition-[width]"
                                style={{ width: `${(activeStep / (QUEUE_STEPS.length - 1)) * 100}%` }}
                            />
                            {QUEUE_STEPS.map((step, index) => {
                                const isComplete = index < activeStep
                                const isCurrent = index === activeStep

                                return (
                                    <div key={step} className="relative z-10 flex w-16 flex-col items-center gap-2 text-center sm:w-24">
                                        <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                            isComplete || isCurrent
                                                ? 'border-brand-600 bg-brand-600 text-white'
                                                : 'border-slate-300 bg-white text-transparent dark:border-slate-700 dark:bg-slate-900'
                                        }`}>
                                            {isComplete ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                                        </span>
                                        <span className={`text-[10px] font-medium sm:text-xs ${
                                            isCurrent ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'
                                        }`}>
                                            {step}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            ) : (
                <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <Ticket className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">No active ticket</h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Join a queue to see your live position and estimated wait time here.
                    </p>
                    <Link
                        to="/student/join-queue"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                        Join a queue <ArrowRight className="h-4 w-4" />
                    </Link>
                </section>
            )}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Queue History</h3>
                </div>
                {pastTickets.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        No previous tickets yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {pastTickets.map((ticket) => (
                            <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                        <Ticket className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {ticket.queueName || 'Queue'}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            Ticket #{ticket.ticketNumber || ticket.id}
                                            {ticket.createdAt ? ` · ${formatDateTime(ticket.createdAt)}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={ticket.status} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}
