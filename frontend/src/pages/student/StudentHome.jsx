import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Calendar, Ticket, FileText, CheckCircle2, Building2,
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
                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
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
                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
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

export default function StudentHome() {
    const [queues, setQueues] = useState([])
    const [stats, setStats] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)

    const [closedDates, setClosedDates] = useState({ todayClosed: false, todayReason: null, upcoming: [] })

    const load = useCallback(async () => {
        try {
            const [q, s, a, d, cd] = await Promise.all([
                api.get('/api/queues').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/stats').catch(() => ({ data: { data: null } })),
                api.get('/api/user/appointments').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/documents').catch(() => ({ data: { data: [] } })),
                api.get('/api/closed-dates').catch(() => ({ data: { data: null } })),
            ])
            setQueues(q.data?.data || [])
            setStats(s.data?.data || null)
            setAppointments(a.data?.data || [])
            setDocuments(d.data?.data || [])
            setClosedDates(cd.data?.data || { todayClosed: false, todayReason: null, upcoming: [] })
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
            {/* Stat tiles */}
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

            {/* Live Queues */}
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