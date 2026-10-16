import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Ticket,
    CheckCircle2,
    Users,
    TrendingUp,
    Clock,
    Star,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
} from 'lucide-react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import ExportButton from '../../components/ui/ExportButton'
import { SkeletonStats, SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { groupQueuesByDepartment } from '../../lib/groupQueues'
import { stagger, staggerItem } from '../../lib/motion'

function percentChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 1000) / 10
}

const ROLE_COLORS = {
    Students: '#4f46e5',
    Staff: '#f59e0b',
    Admins: '#8b5cf6',
}

const STATUS_COLORS = {
    WAITING: '#f59e0b',
    WAITLISTED: '#0ea5e9',
    CALLED: '#4f46e5',
    SERVING: '#6366f1',
    COMPLETED: '#10b981',
    NO_SHOW: '#ef4444',
    CANCELLED: '#94a3b8',
    TRANSFERRED: '#8b5cf6',
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

function KpiCard({ label, value, delta, icon: Icon, accent }) {
    const isPositive = delta >= 0
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-slate-200 bg-white p-5"
        >
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-600">{label}</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        {value}
                    </div>
                    {delta !== null && delta !== undefined && (
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
                    )}
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
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
            {label && (
                <div className="mb-1.5 font-medium text-slate-900">
                    {typeof label === 'string' && label.includes('-')
                        ? new Date(label).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                        })
                        : label}
                </div>
            )}
            {payload.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
          <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.payload?.fill }}
          />
                    <span className="text-slate-500">{entry.name}:</span>
                    <span className="font-medium text-slate-900">{entry.value}</span>
                </div>
            ))}
        </div>
    )
}

export default function Analytics() {
    const { push } = useToastStore()
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/admin/analytics')
            setAnalytics(res.data.data)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load analytics' })
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
                icon={AlertCircle}
                title="Analytics unavailable"
                description="We couldn't load the analytics data. Try again later."
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

    const roleData = Object.entries(analytics.roleDistribution || {})
        .map(([name, value]) => ({ name, value }))
        .filter((dateValueValue) => dateValueValue.value > 0)

    const statusData = Object.entries(analytics.statusBreakdown || {})
        .map(([key, value]) => ({
            name: STATUS_LABELS[key] || key,
            value,
            color: STATUS_COLORS[key] || '#94a3b8',
        }))
        .filter((dateValueValue2) => dateValueValue2.value > 0)

    const departmentGroups =
        analytics.queues && analytics.queues.length > 0
            ? groupQueuesByDepartment(
                analytics.queues.map((analytic) => ({
                    ...analytic,
                    waitingCount: analytic.waitingNow,
                }))
            )
            : []

    return (
        <>
            <PageHeader
                title="Analytics"
                description="Operational insights for your university."
                action={
                    <ExportButton
                        rows={analytics.queues || []}
                        columns={[
                            { key: 'queueName', label: 'Queue' },
                            { key: 'department', label: 'Department' },
                            { key: 'ticketsToday', label: 'Tickets Today' },
                            { key: 'servedToday', label: 'Served Today' },
                            { key: 'waitingNow', label: 'Waiting Now' },
                            { key: 'avgWaitMinutes', label: 'Avg Wait (min)' },
                            { key: 'avgServiceMinutes', label: 'Avg Service (min)' },
                            { key: 'noShowRate', label: 'No-show Rate (%)' },
                            { key: 'avgRating', label: 'Avg Rating' },
                        ]}
                        filename="uniqueue-analytics-queues"
                        label="Export queues"
                    />
                }
            />

            {/* ─── KPI ROW ─── */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Tickets (7d)"
                    value={analytics.ticketsThisWeek?.toLocaleString() || '0'}
                    delta={ticketsDelta}
                    icon={Ticket}
                    accent="bg-brand-50 text-brand-600"
                />
                <KpiCard
                    label="Completed (7d)"
                    value={analytics.completedThisWeek?.toLocaleString() || '0'}
                    delta={completedDelta}
                    icon={CheckCircle2}
                    accent="bg-emerald-50 text-emerald-600"
                />
                <KpiCard
                    label="New users (7d)"
                    value={analytics.newUsersThisWeek?.toLocaleString() || '0'}
                    delta={newUsersDelta}
                    icon={Users}
                    accent="bg-sky-50 text-sky-600"
                />
                <KpiCard
                    label="Currently waiting"
                    value={analytics.waitingNow?.toLocaleString() || '0'}
                    delta={null}
                    icon={Clock}
                    accent="bg-amber-50 text-amber-600"
                />
            </div>

            {/* ─── ACTIVITY CHART ─── */}
            <Card className="mb-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">Activity trend</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Tickets joined, completed, and new users over the last 14 days
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-600" />
              Joined
            </span>
                        <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Completed
            </span>
                        <span className="flex items-center gap-1.5">
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
                                <linearGradient id="aJoined" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="aCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="aNewUsers" x1="0" y1="0" x2="0" y2="1">
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
                                tickFormatter={(dateValueValue3) =>
                                    new Date(dateValueValue3).toLocaleDateString('en-GB', {
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
                            <Area type="monotone" dataKey="Joined" stroke="#4f46e5" strokeWidth={2} fill="url(#aJoined)" />
                            <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} fill="url(#aCompleted)" />
                            <Area type="monotone" dataKey="New users" stroke="#0ea5e9" strokeWidth={2} fill="url(#aNewUsers)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* ─── PIE CHARTS ROW ─── */}
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-slate-900">User distribution</h3>
                        <p className="mt-0.5 text-xs text-slate-500">By role</p>
                    </div>

                    {roleData.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">No users yet</div>
                    ) : (
                        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={roleData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={75}
                                            paddingAngle={2}
                                            strokeWidth={0}
                                        >
                                            {roleData.map((entry) => (
                                                <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || '#94a3b8'} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <ul className="space-y-2">
                                {roleData.map((item) => {
                                    const total = roleData.reduce((accumulator, itemValue) => accumulator + itemValue.value, 0)
                                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                                    return (
                                        <li key={item.name} className="flex items-center gap-2 text-sm">
                      <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: ROLE_COLORS[item.name] || '#94a3b8' }}
                      />
                                            <span className="flex-1 truncate text-slate-600">{item.name}</span>
                                            <span className="font-medium text-slate-900">{item.value}</span>
                                            <span className="w-10 text-right text-xs text-slate-500">{pct}%</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </Card>

                <Card>
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-slate-900">Ticket status</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Last 14 days</p>
                    </div>

                    {statusData.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">No tickets yet</div>
                    ) : (
                        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={75}
                                            paddingAngle={2}
                                            strokeWidth={0}
                                        >
                                            {statusData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <ul className="space-y-2">
                                {statusData.map((item) => {
                                    const total = statusData.reduce((accumulator, itemValue) => accumulator + itemValue.value, 0)
                                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                                    return (
                                        <li key={item.name} className="flex items-center gap-2 text-sm">
                      <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                      />
                                            <span className="flex-1 truncate text-slate-600">{item.name}</span>
                                            <span className="font-medium text-slate-900">{item.value}</span>
                                            <span className="w-10 text-right text-xs text-slate-500">{pct}%</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </Card>
            </div>

            {/* ─── SECONDARY METRICS ─── */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Avg wait time
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900">
                                {analytics.avgWaitMinutes ?? 0}
                                <span className="ml-1 text-sm font-normal text-slate-500">min</span>
                            </div>
                        </div>
                        <div className="rounded-lg bg-brand-50 p-2">
                            <Clock className="h-5 w-5 text-brand-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Avg service time
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900">
                                {analytics.avgServiceMinutes ?? 0}
                                <span className="ml-1 text-sm font-normal text-slate-500">min</span>
                            </div>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Avg rating
                            </div>
                            <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-slate-900">
                  {analytics.avgRating ?? 0}
                </span>
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            </div>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-2">
                            <Star className="h-5 w-5 text-amber-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* ─── DEPARTMENT SUMMARY ─── */}
            {departmentGroups.length > 0 && (
                <Card padded={false} className="mb-6">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="text-sm font-semibold text-slate-900">Department summary</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Rolled up by department over the past 14 days.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Queues
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Tickets today
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Served today
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Waiting
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Avg wait
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Avg rating
                                </th>
                            </tr>
                            </thead>
                            <motion.tbody
                                variants={stagger(0, 0.04)}
                                initial="initial"
                                animate="animate"
                                className="divide-y divide-slate-100"
                            >
                                {departmentGroups.map((group) => {
                                    const totalToday = group.queues.reduce(
                                        (sum, item) => sum + (item.ticketsToday || 0),
                                        0
                                    )
                                    const totalServed = group.queues.reduce(
                                        (sum, itemValue) => sum + (itemValue.servedToday || 0),
                                        0
                                    )
                                    const totalWaiting = group.queues.reduce(
                                        (sum, itemValue2) => sum + (itemValue2.waitingNow || 0),
                                        0
                                    )
                                    const withWait = group.queues.filter((itemValue3) => itemValue3.avgWaitMinutes > 0)
                                    const avgWait = withWait.length
                                        ? Math.round(
                                        (withWait.reduce((sum, itemValue4) => sum + itemValue4.avgWaitMinutes, 0) /
                                            withWait.length) *
                                        10
                                    ) / 10
                                        : 0
                                    const withRating = group.queues.filter((itemValue5) => itemValue5.avgRating > 0)
                                    const avgRating = withRating.length
                                        ? Math.round(
                                        (withRating.reduce((sum, itemValue6) => sum + itemValue6.avgRating, 0) /
                                            withRating.length) *
                                        10
                                    ) / 10
                                        : 0

                                    return (
                                        <motion.tr
                                            key={group.key}
                                            variants={staggerItem}
                                            className="bg-slate-50/40"
                                        >
                                            <td className="px-6 py-3 text-sm font-semibold text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-brand-600" />
                                                    {group.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm text-slate-600">
                                                {group.queues.length}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm font-medium text-slate-900">
                                                {totalToday}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm text-slate-600">
                                                {totalServed}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm text-slate-600">
                                                {totalWaiting}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm text-slate-600">
                                                {avgWait} min
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                {avgRating > 0 ? (
                                                    <span className="inline-flex items-center gap-1">
                            <span className="text-sm font-medium text-slate-900">
                              {avgRating}
                            </span>
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </motion.tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* ─── PER-QUEUE TABLE ─── */}
            {analytics.queues && analytics.queues.length > 0 && (
                <Card padded={false} className="mb-6">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="text-sm font-semibold text-slate-900">Per-queue breakdown</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Performance for each queue over the past 14 days.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Queue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Today
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Served
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Waiting
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Avg wait
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Rating
                                </th>
                            </tr>
                            </thead>
                            <motion.tbody
                                variants={stagger(0, 0.03)}
                                initial="initial"
                                animate="animate"
                                className="divide-y divide-slate-100"
                            >
                                {analytics.queues.map((analyticValue) => (
                                    <motion.tr key={analyticValue.queueId} variants={staggerItem}>
                                        <td className="px-6 py-3 text-sm font-medium text-slate-900">
                                            {analyticValue.queueName}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-500">
                                            {analyticValue.department || '—'}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {analyticValue.ticketsToday}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {analyticValue.servedToday}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {analyticValue.waitingNow}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {analyticValue.avgWaitMinutes} min
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {analyticValue.avgRating > 0 ? (
                                                <span className="inline-flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-900">
                            {analyticValue.avgRating}
                          </span>
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* ─── STAFF PERFORMANCE ─── */}
            {analytics.staff && analytics.staff.length > 0 && (
                <Card padded={false}>
                    <div className="border-b border-slate-100 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Staff performance</h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Tickets served and feedback received in the last 14 days.
                                </p>
                            </div>
                            <ExportButton
                                rows={analytics.staff}
                                columns={[
                                    { key: 'fullName', label: 'Staff' },
                                    { key: 'ticketsServed', label: 'Tickets Served' },
                                    { key: 'avgServiceMinutes', label: 'Avg Service (min)' },
                                    { key: 'avgRating', label: 'Avg Rating' },
                                ]}
                                filename="uniqueue-analytics-staff"
                                label="Export staff"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Staff
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Served
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Avg service
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Rating
                                </th>
                            </tr>
                            </thead>
                            <motion.tbody
                                variants={stagger(0, 0.03)}
                                initial="initial"
                                animate="animate"
                                className="divide-y divide-slate-100"
                            >
                                {analytics.staff.map((analyticValue2) => (
                                    <motion.tr key={analyticValue2.staffId} variants={staggerItem}>
                                        <td className="px-6 py-3 text-sm font-medium text-slate-900">
                                            {analyticValue2.fullName}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {analyticValue2.ticketsServed}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {analyticValue2.avgServiceMinutes} min
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {analyticValue2.avgRating > 0 ? (
                                                <span className="inline-flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-900">
                            {analyticValue2.avgRating}
                          </span>
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>
                </Card>
            )}
        </>
    )
}