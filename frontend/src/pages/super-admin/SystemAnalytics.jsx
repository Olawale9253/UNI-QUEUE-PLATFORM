import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    Ticket,
    CheckCircle2,
    Building2,
    TrendingUp,
    TrendingDown,
    Clock,
    Trophy,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ExportButton from '../../components/ui/ExportButton'
import { SkeletonStats, SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem } from '../../lib/motion'

function percentChange(current, previous) {
    if (previous === 0) {
        return current > 0 ? 100 : 0
    }
    return Math.round(((current - previous) / previous) * 1000) / 10
}

function KpiCard({ label, value, delta, icon: Icon, accent }) {
    const isPositive = delta >= 0
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <span>{label}</span>
                        <svg
                            className="h-3 w-3 text-slate-400"
                            viewBox="0 0 12 12"
                            fill="currentColor"
                        >
                            <path d="M3 5l3 3 3-3z" />
                        </svg>
                    </div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        {value}
                    </div>
                    <div
                        className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                    >
                        {isPositive ? (
                            <ArrowUpRight className="h-3 w-3" />
                        ) : (
                            <ArrowDownRight className="h-3 w-3" />
                        )}
                        {isPositive ? '+' : ''}
                        {delta}%
                        <span className="text-slate-400">vs last week</span>
                    </div>
                </div>
                {Icon && (
                    <div className={`rounded-lg p-2 ${accent}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>
        </motion.div>
    )
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-1.5 font-medium text-slate-900 dark:text-slate-100">
                {new Date(label).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                })}
            </div>
            {payload.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
          <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
          />
                    <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{entry.value}</span>
                </div>
            ))}
        </div>
    )
}

export default function SystemAnalytics() {
    const { push } = useToastStore()
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/super-admin/analytics')
            setAnalytics(res.data.data)
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    if (loading) {
        return (
            <div className="space-y-6">
                <SkeletonStats count={4} />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        )
    }

    if (!analytics) {
        return (
            <EmptyState
                icon={TrendingUp}
                title="Analytics unavailable"
                description="Couldn't load system analytics. Try again later."
            />
        )
    }

    const ticketsDelta = percentChange(analytics.ticketsThisWeek, analytics.ticketsLastWeek)
    const completedDelta = percentChange(analytics.completedThisWeek, analytics.completedLastWeek)
    const newUsersDelta = percentChange(analytics.newUsersThisWeek, analytics.newUsersLastWeek)

    const trendData = (analytics.dailyTrend || []).map((dateValue) => ({
        date: dateValue.date,
        Joined: dateValue.joined,
        Completed: dateValue.completed,
        'New users': dateValue.newUsers,
    }))

    const sortedUniversities = [...(analytics.universities || [])].sort(
        (firstValue, secondValue) => (secondValue.ticketsAllTime || 0) - (firstValue.ticketsAllTime || 0)
    )
    const topUniversities = sortedUniversities.slice(0, 5)

    return (
        <div className="space-y-6 pb-12">
            {/* KPI ROW */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Tickets (7d)"
                    value={analytics.ticketsThisWeek?.toLocaleString() || '0'}
                    delta={ticketsDelta}
                    icon={Ticket}
                    accent="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                />
                <KpiCard
                    label="Completed (7d)"
                    value={analytics.completedThisWeek?.toLocaleString() || '0'}
                    delta={completedDelta}
                    icon={CheckCircle2}
                    accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                />
                <KpiCard
                    label="New users (7d)"
                    value={analytics.newUsersThisWeek?.toLocaleString() || '0'}
                    delta={newUsersDelta}
                    icon={Users}
                    accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                />
                <KpiCard
                    label="Active universities"
                    value={analytics.activeUniversities?.toLocaleString() || '0'}
                    delta={0}
                    icon={Building2}
                    accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                />
            </div>

            {/* BIG TREND CHART */}
            <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            Platform activity
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Tickets joined, completed, and new users over the last 14 days
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-brand-600" />
                            Joined
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Completed
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-sky-500" />
                            New users
                        </span>
                    </div>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={trendData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorJoined" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                tickLine={false}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickFormatter={(dateValueValue) =>
                                    new Date(dateValueValue).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                    })
                                }
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="Joined" stroke="#4f46e5" strokeWidth={2} fill="url(#colorJoined)" />
                            <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} fill="url(#colorCompleted)" />
                            <Area type="monotone" dataKey="New users" stroke="#0ea5e9" strokeWidth={2} fill="url(#colorNewUsers)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* SECONDARY METRICS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Avg wait time
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                {analytics.avgWaitMinutes ?? 0}
                                <span className="ml-1 text-sm font-normal text-slate-500 dark:text-slate-400">min</span>
                            </div>
                        </div>
                        <div className="rounded-lg bg-brand-50 p-2 dark:bg-brand-950/40">
                            <Clock className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Avg service time
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                {analytics.avgServiceMinutes ?? 0}
                                <span className="ml-1 text-sm font-normal text-slate-500 dark:text-slate-400">min</span>
                            </div>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/40">
                            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Currently waiting
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                {analytics.waitingNow ?? 0}
                            </div>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/40">
                            <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* USER GROWTH CHART */}
            <Card>
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">New user signups</h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Last 14 days</p>
                </div>
                <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={trendData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                tickLine={false}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickFormatter={(dateValueValue2) =>
                                    new Date(dateValueValue2).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                    })
                                }
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="New users"
                                stroke="#0ea5e9"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* LEADERBOARD */}
            {topUniversities.length > 0 && (
                <Card>
                    <div className="mb-4 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Most active universities
                        </h3>
                    </div>

                    <motion.ul
                        variants={stagger(0, 0.05)}
                        initial="initial"
                        animate="animate"
                        className="space-y-2"
                    >
                        {topUniversities.map((topUniversity, idx) => (
                            <motion.li
                                key={topUniversity.universityId}
                                variants={staggerItem}
                                className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800"
                            >
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                        idx === 0
                                            ? 'bg-amber-100 text-amber-700'
                                            : idx === 1
                                                ? 'bg-slate-200 text-slate-700'
                                                : idx === 2
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    {idx + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {topUniversity.name}
                    </span>
                                        <Badge variant="default">{topUniversity.code}</Badge>
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                                        <span>{topUniversity.users} users</span>
                                        <span>{topUniversity.queues} queues</span>
                                        <span>{topUniversity.ticketsAllTime} tickets all-time</span>
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        {topUniversity.ticketsToday}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wide text-slate-500">
                                        today
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </motion.ul>
                </Card>
            )}

            {/* FULL BREAKDOWN TABLE */}
            {analytics.universities && analytics.universities.length > 0 && (
                <Card padded={false}>
                    <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Detailed breakdown across all universities
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Users
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Staff
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Queues
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Today
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    All-time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Status
                                </th>
                            </tr>
                            </thead>
                            <motion.tbody
                                variants={stagger(0, 0.03)}
                                initial="initial"
                                animate="animate"
                                className="divide-y divide-slate-100 dark:divide-slate-800"
                            >
                                {analytics.universities.map((analytic) => (
                                    <motion.tr key={analytic.universityId} variants={staggerItem}>
                                        <td className="px-6 py-3 font-mono text-sm text-slate-700 dark:text-slate-300">
                                            {analytic.code}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">{analytic.name}</td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                                            {analytic.users}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                                            {analytic.staff}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                                            {analytic.queues}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {analytic.ticketsToday}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                                            {analytic.ticketsAllTime}
                                        </td>
                                        <td className="px-6 py-3">
                                            <Badge variant={analytic.isActive ? 'success' : 'default'}>
                                                {analytic.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    )
}