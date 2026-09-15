import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Building2,
    Users,
    LayoutGrid,
    Ticket,
    Clock,
    TrendingUp,
    Star,
    Trophy,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import ExportButton from '../../components/ui/ExportButton'
import { SkeletonStats, SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem } from '../../lib/motion'

export default function SystemAnalytics() {
    const { push } = useToastStore()
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/super-admin/analytics')
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
                icon={TrendingUp}
                title="Analytics unavailable"
                description="Couldn't load system analytics. Try again later."
            />
        )
    }

    const maxDaily = Math.max(
        1,
        ...(analytics.dailyTrend || []).map((d) => Math.max(d.joined, d.completed))
    )

    // Sort universities by activity for leaderboard
    const sortedUniversities = [...(analytics.universities || [])].sort(
        (a, b) => (b.ticketsAllTime || 0) - (a.ticketsAllTime || 0)
    )
    const topUniversities = sortedUniversities.slice(0, 5)

    return (
        <>
            <PageHeader
                title="System Analytics"
                description="Platform-wide metrics across every university."
                action={
                    <ExportButton
                        rows={analytics.universities || []}
                        columns={[
                            { key: 'code', label: 'Code' },
                            { key: 'name', label: 'Name' },
                            { key: 'users', label: 'Users' },
                            { key: 'staff', label: 'Staff' },
                            { key: 'queues', label: 'Queues' },
                            { key: 'ticketsToday', label: 'Tickets Today' },
                            { key: 'ticketsAllTime', label: 'Tickets All-Time' },
                        ]}
                        filename="uniqueue-system-analytics"
                        label="Export universities"
                    />
                }
            />

            {/* Overview */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Universities"
                    value={analytics.totalUniversities}
                    icon={Building2}
                    delay={0}
                    hint={`${analytics.activeUniversities} active`}
                />
                <StatCard
                    label="Total users"
                    value={analytics.totalUsers}
                    icon={Users}
                    delay={0.05}
                    hint={`${analytics.totalAdmins} admins · ${analytics.totalStaff} staff`}
                />
                <StatCard
                    label="Active queues"
                    value={analytics.activeQueues}
                    icon={LayoutGrid}
                    delay={0.1}
                    hint={`${analytics.totalQueues} total`}
                />
                <StatCard
                    label="Tickets today"
                    value={analytics.ticketsToday}
                    icon={Ticket}
                    delay={0.15}
                    hint={`${analytics.ticketsAllTime} all-time`}
                />
            </div>

            {/* Platform averages */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                                Currently waiting
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900">
                                {analytics.waitingNow ?? 0}
                            </div>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-2">
                            <Users className="h-5 w-5 text-amber-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* 7-day trend */}
            {analytics.dailyTrend && analytics.dailyTrend.length > 0 && (
                <Card className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                                Platform activity (last 7 days)
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Tickets joined vs completed across all universities.
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
                        </div>
                    </div>

                    <div className="space-y-3">
                        {analytics.dailyTrend.map((d) => (
                            <div key={d.date} className="flex items-center gap-3">
                                <div className="w-20 shrink-0 text-xs font-medium text-slate-500">
                                    {new Date(d.date).toLocaleDateString('en-GB', {
                                        weekday: 'short',
                                        day: '2-digit',
                                    })}
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(d.joined / maxDaily) * 100}%` }}
                                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                                className="h-full rounded-full bg-brand-600"
                                            />
                                        </div>
                                        <span className="w-8 text-right text-xs font-medium text-slate-600">
                      {d.joined}
                    </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(d.completed / maxDaily) * 100}%` }}
                                                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                                                className="h-full rounded-full bg-emerald-500"
                                            />
                                        </div>
                                        <span className="w-8 text-right text-xs font-medium text-slate-600">
                      {d.completed}
                    </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Top universities leaderboard */}
            {topUniversities.length > 0 && (
                <Card className="mb-8">
                    <div className="mb-4 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-slate-900">
                            Most active universities
                        </h3>
                    </div>

                    <motion.ul
                        variants={stagger(0, 0.05)}
                        initial="initial"
                        animate="animate"
                        className="space-y-2"
                    >
                        {topUniversities.map((u, idx) => (
                            <motion.li
                                key={u.universityId}
                                variants={staggerItem}
                                className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
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
                    <span className="text-sm font-semibold text-slate-900">
                      {u.name}
                    </span>
                                        <Badge variant="default">{u.code}</Badge>
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                                        <span>{u.users} users</span>
                                        <span>{u.queues} queues</span>
                                        <span>{u.ticketsAllTime} tickets all-time</span>
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <div className="text-lg font-semibold text-slate-900">
                                        {u.ticketsToday}
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

            {/* Full breakdown table */}
            {analytics.universities && analytics.universities.length > 0 && (
                <Card padded={false}>
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="text-sm font-semibold text-slate-900">
                            All universities — detailed breakdown
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Users
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Staff
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Queues
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Today
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                    All-time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Status
                                </th>
                            </tr>
                            </thead>
                            <motion.tbody
                                variants={stagger(0, 0.03)}
                                initial="initial"
                                animate="animate"
                                className="divide-y divide-slate-100"
                            >
                                {analytics.universities.map((u) => (
                                    <motion.tr key={u.universityId} variants={staggerItem}>
                                        <td className="px-6 py-3 font-mono text-sm text-slate-700">
                                            {u.code}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-900">{u.name}</td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {u.users}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {u.staff}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {u.queues}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm font-medium text-slate-900">
                                            {u.ticketsToday}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {u.ticketsAllTime}
                                        </td>
                                        <td className="px-6 py-3">
                                            <Badge variant={u.isActive ? 'success' : 'default'}>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
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