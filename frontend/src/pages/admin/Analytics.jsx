import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Ticket, CheckCircle2, Users, TrendingUp, Clock, Star, AlertCircle, ArrowUpRight, ArrowDownRight, Building2,
} from 'lucide-react'
import {
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ExportButton from '../../components/ui/ExportButton'
import { SkeletonStats, SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { groupQueuesByDepartment } from '../../lib/groupQueues'
import { stagger, staggerItem } from '../../lib/motion'

function percentChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 1000) / 10
}

const ROLE_COLORS = { Students: '#4f46e5', Staff: '#f59e0b', Admins: '#8b5cf6' }
const STATUS_COLORS = { WAITING: '#f59e0b', WAITLISTED: '#0ea5e9', CALLED: '#4f46e5', SERVING: '#6366f1', COMPLETED: '#10b981', NO_SHOW: '#ef4444', CANCELLED: '#94a3b8', TRANSFERRED: '#8b5cf6' }
const STATUS_LABELS = { WAITING: 'Waiting', WAITLISTED: 'Waitlisted', CALLED: 'Called', SERVING: 'Serving', COMPLETED: 'Completed', NO_SHOW: 'No-show', CANCELLED: 'Cancelled', TRANSFERRED: 'Transferred' }

function KpiCard({ label, value, delta, icon: Icon, accent }) {
    const isPositive = delta >= 0
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
                    </div>
                    {Icon && (
                        <div className={`rounded-xl p-2.5 ${accent}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {delta !== null && delta !== undefined ? (
                        <div className={`inline-flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {isPositive ? '+' : ''}{delta}%
                            <span className="text-slate-400 font-normal ml-1">vs last week</span>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 font-medium">Live data</span>
                    )}
                </div>
            </Card>
        </motion.div>
    )
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-800">
            {label && (
                <div className="mb-1.5 font-bold text-slate-900 dark:text-slate-100">
                    {typeof label === 'string' && label.includes('-')
                        ? new Date(label).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
                        : label}
                </div>
            )}
            {payload.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill }} />
                    <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{entry.value}</span>
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
            push({ type: 'error', message: err.message || 'Failed to load analytics' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <SkeletonStats count={4} />
                <SkeletonCard />
            </div>
        )
    }

    if (!analytics) {
        return (
            <div className="space-y-6 pb-12">
                <EmptyState icon={AlertCircle} title="Analytics unavailable" description="We couldn't load the data. Try again later." />
            </div>
        )
    }

    const ticketsDelta = percentChange(analytics.ticketsThisWeek, analytics.ticketsLastWeek)
    const completedDelta = percentChange(analytics.completedThisWeek, analytics.completedLastWeek)
    const newUsersDelta = percentChange(analytics.newUsersThisWeek, analytics.newUsersLastWeek)

    const trendData = (analytics.dailyTrend || []).map((dateValue) => ({
        date: dateValue.date, Joined: dateValue.joined, Completed: dateValue.completed, 'New users': dateValue.newUsers,
    }))

    const roleData = Object.entries(analytics.roleDistribution || {}).map(([name, value]) => ({ name, value })).filter((v) => v.value > 0)
    const statusData = Object.entries(analytics.statusBreakdown || {}).map(([key, value]) => ({ name: STATUS_LABELS[key] || key, value, color: STATUS_COLORS[key] || '#94a3b8' })).filter((v) => v.value > 0)

    const departmentGroups = analytics.queues && analytics.queues.length > 0
        ? groupQueuesByDepartment(analytics.queues.map((analytic) => ({ ...analytic, waitingCount: analytic.waitingNow })))
        : []

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Reports & Trends</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Analyze your university's performance and user growth over time.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard label="Tickets (7d)" value={analytics.ticketsThisWeek?.toLocaleString() || '0'} delta={ticketsDelta} icon={Ticket} accent="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400" />
                <KpiCard label="Completed (7d)" value={analytics.completedThisWeek?.toLocaleString() || '0'} delta={completedDelta} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
                <KpiCard label="New users (7d)" value={analytics.newUsersThisWeek?.toLocaleString() || '0'} delta={newUsersDelta} icon={Users} accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400" />
                <KpiCard label="Currently waiting" value={analytics.waitingNow?.toLocaleString() || '0'} delta={null} icon={Clock} accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" />
            </div>

            <Card>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Activity Trend</h3>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Tickets joined, completed, and new users over the last 14 days.</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="h-2 w-2 rounded-full bg-brand-600" /> Joined</span>
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed</span>
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="h-2 w-2 rounded-full bg-sky-500" /> New users</span>
                    </div>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="aJoined" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient>
                                <linearGradient id="aCompleted" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.25} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                <linearGradient id="aNewUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="Joined" stroke="#4f46e5" strokeWidth={2} fill="url(#aJoined)" />
                            <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} fill="url(#aCompleted)" />
                            <Area type="monotone" dataKey="New users" stroke="#0ea5e9" strokeWidth={2} fill="url(#aNewUsers)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">User Distribution</h3>
                    {roleData.length === 0 ? <div className="py-8 text-center text-sm text-slate-500">No users yet</div> : (
                        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} strokeWidth={0}>
                                            {roleData.map((entry) => <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || '#94a3b8'} />)}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <ul className="space-y-3">
                                {roleData.map((item) => {
                                    const total = roleData.reduce((acc, val) => acc + val.value, 0)
                                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                                    return (
                                        <li key={item.name} className="flex items-center gap-2 text-sm">
                                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ROLE_COLORS[item.name] || '#94a3b8' }} />
                                            <span className="flex-1 truncate font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                                            <span className="font-bold text-slate-900 dark:text-slate-100">{item.value}</span>
                                            <span className="w-10 text-right text-xs font-medium text-slate-500">{pct}%</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </Card>

                <Card>
                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Ticket Status</h3>
                    {statusData.length === 0 ? <div className="py-8 text-center text-sm text-slate-500">No tickets yet</div> : (
                        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} strokeWidth={0}>
                                            {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <ul className="space-y-3">
                                {statusData.map((item) => {
                                    const total = statusData.reduce((acc, val) => acc + val.value, 0)
                                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                                    return (
                                        <li key={item.name} className="flex items-center gap-2 text-sm">
                                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="flex-1 truncate font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                                            <span className="font-bold text-slate-900 dark:text-slate-100">{item.value}</span>
                                            <span className="w-10 text-right text-xs font-medium text-slate-500">{pct}%</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg wait time</div>
                        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{analytics.avgWaitMinutes ?? 0}<span className="ml-1 text-sm font-normal text-slate-500">min</span></div>
                    </div>
                    <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"><Clock className="h-5 w-5" /></div>
                </Card>
                <Card className="flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg service time</div>
                        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{analytics.avgServiceMinutes ?? 0}<span className="ml-1 text-sm font-normal text-slate-500">min</span></div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><TrendingUp className="h-5 w-5" /></div>
                </Card>
                <Card className="flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg rating</div>
                        <div className="mt-2 flex items-baseline gap-1"><span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{analytics.avgRating ?? 0}</span><Star className="h-4 w-4 fill-amber-400 text-amber-400" /></div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"><Star className="h-5 w-5" /></div>
                </Card>
            </div>

            {departmentGroups.length > 0 && (
                <Card padded={false}>
                    <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Department Summary</h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Rolled up by department over the past 14 days.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Department</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Queues</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tickets Today</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Served</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Waiting</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Wait</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rating</th>
                            </tr>
                            </thead>
                            <motion.tbody variants={stagger(0, 0.04)} initial="initial" animate="animate" className="divide-y divide-slate-100 dark:divide-slate-800">
                                {departmentGroups.map((group) => {
                                    const totalToday = group.queues.reduce((s, i) => s + (i.ticketsToday || 0), 0)
                                    const totalServed = group.queues.reduce((s, i) => s + (i.servedToday || 0), 0)
                                    const totalWaiting = group.queues.reduce((s, i) => s + (i.waitingNow || 0), 0)
                                    const withWait = group.queues.filter((i) => i.avgWaitMinutes > 0)
                                    const avgWait = withWait.length ? Math.round((withWait.reduce((s, i) => s + i.avgWaitMinutes, 0) / withWait.length) * 10) / 10 : 0
                                    const withRating = group.queues.filter((i) => i.avgRating > 0)
                                    const avgRating = withRating.length ? Math.round((withRating.reduce((s, i) => s + i.avgRating, 0) / withRating.length) * 10) / 10 : 0

                                    return (
                                        <motion.tr key={group.key} variants={staggerItem} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">
                                                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-brand-600" />{group.label}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-slate-600 dark:text-slate-300">{group.queues.length}</td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-slate-900 dark:text-slate-100">{totalToday}</td>
                                            <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">{totalServed}</td>
                                            <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">{totalWaiting}</td>
                                            <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">{avgWait} min</td>
                                            <td className="px-6 py-4 text-right">
                                                {avgRating > 0 ? (
                                                    <span className="inline-flex items-center gap-1"><span className="text-sm font-bold text-slate-900 dark:text-slate-100">{avgRating}</span><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /></span>
                                                ) : (<span className="text-xs text-slate-400">—</span>)}
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </motion.tbody>
                        </table>
                    </div>
                </Card>
            )}

            {analytics.queues && analytics.queues.length > 0 && (
                <Card padded={false}>
                    <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Per-Queue Breakdown</h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Performance for each queue over the past 14 days.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Queue</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Department</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Served</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Waiting</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Wait</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rating</th>
                            </tr>
                            </thead>
                            <motion.tbody variants={stagger(0, 0.03)} initial="initial" animate="animate" className="divide-y divide-slate-100 dark:divide-slate-800">
                                {analytics.queues.map((analyticValue) => (
                                    <motion.tr key={analyticValue.queueId} variants={staggerItem} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{analyticValue.queueName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{analyticValue.department || '—'}</td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">{analyticValue.ticketsToday}</td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">{analyticValue.servedToday}</td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">{analyticValue.waitingNow}</td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">{analyticValue.avgWaitMinutes} min</td>
                                        <td className="px-6 py-4 text-right">
                                            {analyticValue.avgRating > 0 ? (
                                                <span className="inline-flex items-center gap-1"><span className="text-sm font-bold text-slate-900 dark:text-slate-100">{analyticValue.avgRating}</span><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /></span>
                                            ) : (<span className="text-xs text-slate-400">—</span>)}
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>
                </Card>
            )}

            {analytics.staff && analytics.staff.length > 0 && (
                <Card padded={false}>
                    <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Staff Performance</h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Tickets served and feedback received in the last 14 days.</p>
                        </div>
                        <ExportButton rows={analytics.staff} columns={[{ key: 'fullName', label: 'Staff' },{ key: 'ticketsServed', label: 'Tickets Served' },{ key: 'avgServiceMinutes', label: 'Avg Service (min)' },{ key: 'avgRating', label: 'Avg Rating' }]} filename="uniqueue-analytics-staff" label="Export staff" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Staff</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Served</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Service</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rating</th>
                            </tr>
                            </thead>
                            <motion.tbody variants={stagger(0, 0.03)} initial="initial" animate="animate" className="divide-y divide-slate-100 dark:divide-slate-800">
                                {analytics.staff.map((analyticValue2) => (
                                    <motion.tr key={analyticValue2.staffId} variants={staggerItem} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{analyticValue2.fullName}</td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">{analyticValue2.ticketsServed}</td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">{analyticValue2.avgServiceMinutes} min</td>
                                        <td className="px-6 py-4 text-right">
                                            {analyticValue2.avgRating > 0 ? (
                                                <span className="inline-flex items-center gap-1"><span className="text-sm font-bold text-slate-900 dark:text-slate-100">{analyticValue2.avgRating}</span><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /></span>
                                            ) : (<span className="text-xs text-slate-400">—</span>)}
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