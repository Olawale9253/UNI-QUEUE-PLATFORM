import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Calendar, Ticket, FileText, CheckCircle2, Building2,
    Route as RouteIcon, ArrowRight, Clock,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { groupQueuesByOffice } from '../../lib/groupQueues'

function StatTile({ label, value, icon: Icon, accent, valueColor, to, ctaLabel, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {label}
                        </div>
                        <div className={`mt-2 text-3xl font-bold tracking-tight ${valueColor}`}>
                            {value}
                        </div>
                    </div>
                    {Icon && (
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                </div>
                {to && (
                    <Link
                        to={to}
                        className="mt-auto pt-3 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
                    >
                        {ctaLabel || 'View all'} →
                    </Link>
                )}
            </Card>
        </motion.div>
    )
}

function LiveQueueCard({ office }) {
    const hasQueue = office.queue != null
    const waitingCount = office.queue?.waitingCount ?? 0
    const currentlyServing = office.queue?.currentlyServing || 'None'
    const avgWait = office.queue?.estimatedMinutes ?? 0

    return (
        <Card className="flex h-full flex-col">
            <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                    {office.name}
                </h3>
                {hasQueue && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        Live
                    </span>
                )}
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-400">
                Waiting:{' '}
                <span className="font-bold text-brand-600 dark:text-brand-400">
                    {waitingCount}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Now Serving
                    </div>
                    <div
                        className={`mt-1 truncate text-sm font-bold ${
                            currentlyServing && currentlyServing !== 'None'
                                ? 'font-mono text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                        }`}
                    >
                        {currentlyServing}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Avg Wait
                    </div>
                    <div className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                        {avgWait} min
                    </div>
                </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Link
                    to="/student/queues"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
                >
                    Join this queue →
                </Link>
            </div>
        </Card>
    )
}

function ActiveClearanceCard({ data }) {
    const pct = data.progressPercent ?? 0
    const next = data.nextAction

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-xl border border-brand-300 bg-gradient-to-br from-brand-50 to-white p-5 dark:border-brand-700 dark:from-brand-950/40 dark:to-slate-900"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm">
                        <RouteIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                            Active progress
                        </div>
                        <h3 className="mt-0.5 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                            {data.workflowName}
                        </h3>
                        {data.session && (
                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <Clock className="h-3 w-3" />
                                Session {data.session}
                            </div>
                        )}
                    </div>
                </div>

                <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                    {pct}%
                </span>
            </div>

            <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                    />
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-300">{data.completedSteps}</strong>
                    {' '}of{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{data.totalSteps}</strong>
                    {' '}steps complete
                </div>
            </div>

            {next && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-brand-200 bg-white/70 px-3 py-2.5 dark:border-brand-800 dark:bg-slate-900/60">
                    <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                            Next step
                        </div>
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {next.label || next.queueName}
                        </div>
                        {next.officeName && (
                            <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                {next.officeName}
                            </div>
                        )}
                    </div>
                    <Link
                        to="/student/clearance"
                        className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                    >
                        Continue
                    </Link>
                </div>
            )}

            <div className="mt-3 flex justify-end">
                <Link
                    to="/student/workflows"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                >
                    All workflows
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </motion.div>
    )
}

export default function StudentHome() {
    const [queues, setQueues] = useState([])
    const [stats, setStats] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [documents, setDocuments] = useState([])
    const [activeClearance, setActiveClearance] = useState(null)
    const [loading, setLoading] = useState(true)

    const sawInProgressRef = useRef(false)

    const load = useCallback(async () => {
        try {
            const [q, s, a, d, mp] = await Promise.all([
                api.get('/api/queues').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/stats').catch(() => ({ data: { data: null } })),
                api.get('/api/user/appointments').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/documents').catch(() => ({ data: { data: [] } })),
                api.get('/api/student/workflows/my-progress').catch(() => ({ data: { data: null } })),
            ])
            setQueues(q.data?.data || [])
            setStats(s.data?.data || null)
            setAppointments(a.data?.data || [])
            setDocuments(d.data?.data || [])

            const mpData = mp.data?.data || null
            if (mpData && mpData.status === 'IN_PROGRESS') {
                sawInProgressRef.current = true
                setActiveClearance(mpData)
            } else if (mpData && mpData.status === 'COMPLETED') {
                if (sawInProgressRef.current) {
                    setActiveClearance(mpData)
                } else {
                    setActiveClearance(null)
                }
            } else {
                setActiveClearance(null)
            }
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    const liveQueues = useMemo(() => {
        const groups = groupQueuesByOffice(queues.filter((q) => q.isActive !== false))
        return groups
            .map((g) => {
                const sorted = [...g.queues].sort(
                    (a, b) => (b.waitingCount ?? 0) - (a.waitingCount ?? 0)
                )
                return {
                    key: g.key,
                    name: g.label,
                    queue: sorted[0] || null,
                }
            })
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [queues])

    const myAppointments = appointments.filter(
        (a) => a.status === 'BOOKED' || a.status === 'CONFIRMED'
    ).length
    const myQueueTickets = stats?.hasActiveTicket ? 1 : stats?.todayJoined ?? 0
    const myDocuments = documents.length
    const completedTasks = stats?.totalCompleted ?? 0

    return (
        <>
            <div className="mb-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatTile
                    label="My Appointments"
                    value={myAppointments}
                    icon={Calendar}
                    accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                    valueColor="text-violet-600 dark:text-violet-400"
                    to="/student/appointments"
                    ctaLabel="View all"
                    delay={0}
                />
                <StatTile
                    label="My Queue Tickets"
                    value={myQueueTickets}
                    icon={Ticket}
                    accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    valueColor="text-emerald-600 dark:text-emerald-400"
                    to="/student/queues"
                    ctaLabel="View all"
                    delay={0.05}
                />
                <StatTile
                    label="My Documents"
                    value={myDocuments}
                    icon={FileText}
                    accent="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                    valueColor="text-purple-600 dark:text-purple-400"
                    to="/student/documents"
                    ctaLabel="View all"
                    delay={0.1}
                />
                <StatTile
                    label="Completed Tasks"
                    value={completedTasks}
                    icon={CheckCircle2}
                    accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                    valueColor="text-amber-600 dark:text-amber-400"
                    delay={0.15}
                />
            </div>

            {activeClearance && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="mb-7"
                >
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            My Progress
                        </h2>
                        <Link
                            to="/student/workflows"
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                            View all →
                        </Link>
                    </div>
                    <ActiveClearanceCard data={activeClearance} />
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Live Queues
                    </h2>
                    <Link
                        to="/student/queues"
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                        View my queues →
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-44 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                            />
                        ))}
                    </div>
                ) : liveQueues.length === 0 ? (
                    <Card>
                        <div className="py-12 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <Building2 className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                No open queues
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Check back shortly — your university hasn't opened any queues yet.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={{ initial: {}, animate: { transition: { staggerChildren: 0.04 } } }}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {liveQueues.map((o) => (
                            <motion.div
                                key={o.key}
                                variants={{ initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } }}
                            >
                                <LiveQueueCard office={o} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </>
    )
}