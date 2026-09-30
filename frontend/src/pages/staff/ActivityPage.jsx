import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Ticket, CheckCircle2, TrendingUp, Award, Clock, Activity as ActivityIcon,
    CalendarCheck, XCircle, Building2, AlertCircle, Zap,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { SkeletonStats, SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

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

const TILE_DELAYS = [0, 0.05, 0.1, 0.15, 0.2]

function KpiTile({ label, value, hint, icon: Icon, accent, valueColor, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {label}
                        </div>
                        <div className={`mt-2 truncate text-3xl font-bold tracking-tight ${valueColor}`}>
                            {value}
                        </div>
                        {hint && (
                            <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                {hint}
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    )
}

function relativeTime(dt) {
    if (!dt) return ''
    const diff = Date.now() - new Date(dt).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export default function ActivityPage() {
    const { push } = useToastStore()
    const [stats, setStats] = useState(null)
    const [apptStats, setApptStats] = useState(null)
    const [queues, setQueues] = useState([])
    const [recentTickets, setRecentTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [activityLoading, setActivityLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const [s, a, q] = await Promise.all([
                api.get('/api/staff/stats').catch(() => ({ data: { data: null } })),
                api.get('/api/staff/appointments/stats').catch(() => ({ data: { data: null } })),
                api.get('/api/staff/queues').catch(() => ({ data: { data: [] } })),
            ])
            setStats(s.data?.data || null)
            setApptStats(a.data?.data || null)

            const staffQueues = q.data?.data || []
            setQueues(staffQueues)

            if (staffQueues.length > 0) {
                const ticketsByQueue = await Promise.all(
                    staffQueues.map((qu) =>
                        api
                            .get(`/api/staff/queues/${qu.id}/tickets`)
                            .then((res) =>
                                (res.data?.data || []).map((t) => ({ ...t, queueName: qu.name }))
                            )
                            .catch(() => [])
                    )
                )
                const all = ticketsByQueue.flat()

                // Sort by most recent activity
                const sorted = all.sort((a, b) => {
                    const at = a.completedAt || a.calledAt || a.joinedAt
                        ? new Date(a.completedAt || a.calledAt || a.joinedAt).getTime() : 0
                    const bt = b.completedAt || b.calledAt || b.joinedAt
                        ? new Date(b.completedAt || b.calledAt || b.joinedAt).getTime() : 0
                    return bt - at
                })

                setRecentTickets(sorted.slice(0, 20))
            }
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to load activity',
            })
        } finally {
            setLoading(false)
            setActivityLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 10000, slowMs: 30000 })

    const derived = useMemo(() => {
        const servedToday = stats?.servedToday ?? 0
        const servedThisWeek = stats?.servedThisWeek ?? 0
        const servedAllTime = stats?.servedAllTime ?? 0
        const avgService = stats?.avgServiceMinutes ?? 0
        const apptToday = apptStats?.today ?? 0

        const weeklyPace =
            servedThisWeek > 0 ? Math.round((servedThisWeek / 7) * 10) / 10 : 0

        const completed = recentTickets.filter((t) => t.status === 'COMPLETED').length
        const noShows = recentTickets.filter((t) => t.status === 'NO_SHOW').length
        const total = recentTickets.length
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
        const noShowRate = total > 0 ? Math.round((noShows / total) * 100) : 0

        return {
            servedToday, servedThisWeek, servedAllTime, avgService, apptToday,
            weeklyPace, completionRate, noShowRate,
        }
    }, [stats, apptStats, recentTickets])

    const queueBreakdown = useMemo(() => {
        return queues
            .map((q) => ({
                id: q.id,
                name: q.name,
                office: q.officeName || q.department || 'General',
                waiting: q.waitingCount ?? 0,
                currentlyServing: q.currentlyServing,
                estimatedMinutes: q.estimatedMinutes ?? 0,
            }))
            .sort((a, b) => b.waiting - a.waiting)
    }, [queues])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <SkeletonStats count={5} />
                <SkeletonStats count={3} />
                <Card padded={false}>
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                </Card>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Activity
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Your complete service history, productivity, and queue activity.
                </p>
            </div>

            {/* KPI Tiles */}
            <div className="mb-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                <KpiTile
                    label="Served Today"
                    value={derived.servedToday}
                    hint={derived.servedToday === 1 ? 'ticket' : 'tickets'}
                    icon={CheckCircle2}
                    accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    valueColor="text-emerald-600 dark:text-emerald-400"
                    delay={TILE_DELAYS[0]}
                />
                <KpiTile
                    label="This Week"
                    value={derived.servedThisWeek}
                    hint={`${derived.weeklyPace}/day avg`}
                    icon={TrendingUp}
                    accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                    valueColor="text-sky-600 dark:text-sky-400"
                    delay={TILE_DELAYS[1]}
                />
                <KpiTile
                    label="All Time"
                    value={derived.servedAllTime}
                    hint="Total completed"
                    icon={Award}
                    accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                    valueColor="text-violet-600 dark:text-violet-400"
                    delay={TILE_DELAYS[2]}
                />
                <KpiTile
                    label="Avg Service"
                    value={`${derived.avgService}m`}
                    hint="Per ticket"
                    icon={Clock}
                    accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                    valueColor="text-amber-600 dark:text-amber-400"
                    delay={TILE_DELAYS[3]}
                />
                <KpiTile
                    label="Appointments"
                    value={derived.apptToday}
                    hint="Today"
                    icon={CalendarCheck}
                    accent="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                    valueColor="text-rose-600 dark:text-rose-400"
                    delay={TILE_DELAYS[4]}
                />
            </div>

            {/* Performance cards */}
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40">
                            <Zap className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Weekly Pace
                            </div>
                            <div className="mt-1 text-2xl font-bold text-sky-600 dark:text-sky-400">
                                {derived.weeklyPace}
                                <span className="ml-1 text-sm font-normal text-slate-500">tickets/day</span>
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Your rolling 7-day average. Aim to keep it steady across the week.
                    </p>
                </Card>

                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Completion Rate
                            </div>
                            <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {derived.completionRate}%
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Of your recent tickets, the share you served to completion.
                    </p>
                </Card>

                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40">
                            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                No-show Rate
                            </div>
                            <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {derived.noShowRate}%
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Students who were called but didn't show up. Lower is better.
                    </p>
                </Card>
            </div>

            {/* Two-column: Recent Activity + Queue Breakdown */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_400px]">
                <Card padded={false}>
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <ActivityIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Recent Activity
                            </h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {recentTickets.length} {recentTickets.length === 1 ? 'entry' : 'entries'}
            </span>
                    </div>

                    {activityLoading ? (
                        <div>
                            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                        </div>
                    ) : recentTickets.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <Ticket className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                No activity yet
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Tickets from your queues will appear here.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentTickets.map((t) => {
                                const ts = t.completedAt || t.calledAt || t.joinedAt
                                const isCompleted = t.status === 'COMPLETED'
                                const isNoShow = t.status === 'NO_SHOW'
                                const isCancelled = t.status === 'CANCELLED'
                                return (
                                    <li
                                        key={t.id}
                                        className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    >
                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                                    isCompleted
                                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                        : isNoShow
                                                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                                            : isCancelled
                                                                ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                                : 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                                                }`}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                ) : isNoShow ? (
                                                    <XCircle className="h-4 w-4" />
                                                ) : (
                                                    <Ticket className="h-4 w-4" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                            {t.ticketNumber}
                          </span>
                                                    <Badge variant={STATUS_VARIANTS[t.status] || 'default'}>
                                                        {STATUS_LABELS[t.status] || t.status}
                                                    </Badge>
                                                </div>
                                                <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                    {t.queueName}
                                                    {t.userFullName ? ` · ${t.userFullName}` : ''}
                                                </div>
                                            </div>
                                        </div>

                                        {ts && (
                                            <div className="shrink-0 text-right text-[10px] text-slate-400 dark:text-slate-500">
                                                {relativeTime(ts)}
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </Card>

                <Card padded={false}>
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                My Queues
                            </h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {queueBreakdown.length}
            </span>
                    </div>

                    {queueBreakdown.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <Building2 className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                No queues assigned
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {queueBreakdown.map((q) => (
                                <li key={q.id} className="px-5 py-3.5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {q.name}
                                            </div>
                                            <div className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                {q.office}
                                            </div>
                                            {q.currentlyServing && (
                                                <div className="mt-1.5 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Now serving:{' '}
                          </span>
                                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {q.currentlyServing}
                          </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3">
                                            <div className="text-right">
                                                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                                    Waiting
                                                </div>
                                                <div className="text-base font-bold text-brand-600 dark:text-brand-400">
                                                    {q.waiting}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                                    ~Wait
                                                </div>
                                                <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                                                    {q.estimatedMinutes}m
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    )
}