import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    LayoutGrid,
    Users,
    Ticket,
    Clock,
    TrendingUp,
    Star,
    AlertCircle,
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

    const maxDaily = Math.max(
        1,
        ...(analytics.dailyTrend || []).map((d) => Math.max(d.joined, d.completed))
    )

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

            {/* Overview stats */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total queues"
                    value={analytics.totalQueues}
                    icon={LayoutGrid}
                    delay={0}
                    hint={`${analytics.activeQueues} active`}
                />
                <StatCard
                    label="Staff members"
                    value={analytics.totalStaff}
                    icon={Users}
                    delay={0.05}
                />
                <StatCard
                    label="Tickets today"
                    value={analytics.ticketsToday}
                    icon={Ticket}
                    delay={0.1}
                    hint={`${analytics.ticketsAllTime} all time`}
                />
                <StatCard
                    label="Currently waiting"
                    value={analytics.waitingNow}
                    icon={Clock}
                    delay={0.15}
                    hint={
                        analytics.avgWaitMinutes
                            ? `Avg. wait ${analytics.avgWaitMinutes} min`
                            : undefined
                    }
                />
            </div>

            {/* Secondary stats */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                        <div className="rounded-lg bg-brand-50 p-2">
                            <Clock className="h-5 w-5 text-brand-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                No-show rate
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900">
                                {analytics.noShowRate ?? 0}
                                <span className="ml-1 text-sm font-normal text-slate-500">%</span>
                            </div>
                        </div>
                        <div className="rounded-lg bg-rose-50 p-2">
                            <AlertCircle className="h-5 w-5 text-rose-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Avg feedback rating
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

            {/* Daily trend */}
            {analytics.dailyTrend && analytics.dailyTrend.length > 0 && (
                <Card className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">7-day trend</h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Tickets joined vs completed each day.
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

            {/* Per-queue breakdown */}
            {analytics.queues && analytics.queues.length > 0 && (
                <Card padded={false} className="mb-8">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="text-sm font-semibold text-slate-900">Per-queue breakdown</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Performance for each queue over the past 7 days.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Queue
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
                                {analytics.queues.map((q) => (
                                    <motion.tr key={q.queueId} variants={staggerItem}>
                                        <td className="px-6 py-3 text-sm font-medium text-slate-900">
                                            {q.queueName}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {q.ticketsToday}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {q.servedToday}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {q.waitingNow}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {q.avgWaitMinutes} min
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {q.avgRating > 0 ? (
                                                <span className="inline-flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-900">
                            {q.avgRating}
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

            {/* Staff performance */}
            {analytics.staff && analytics.staff.length > 0 && (
                <Card padded={false}>
                    <div className="border-b border-slate-100 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Staff performance</h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Tickets served and feedback received in the last 7 days.
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
                                {analytics.staff.map((s) => (
                                    <motion.tr key={s.staffId} variants={staggerItem}>
                                        <td className="px-6 py-3 text-sm font-medium text-slate-900">
                                            {s.fullName}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {s.ticketsServed}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-slate-600">
                                            {s.avgServiceMinutes} min
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {s.avgRating > 0 ? (
                                                <span className="inline-flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-900">
                            {s.avgRating}
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

            {/* All-time summary */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-brand-50 p-2">
                            <TrendingUp className="h-5 w-5 text-brand-600" />
                        </div>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Total tickets ever
                            </div>
                            <div className="mt-1 text-2xl font-semibold text-slate-900">
                                {analytics.ticketsAllTime}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-emerald-50 p-2">
                            <Ticket className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Tickets today
                            </div>
                            <div className="mt-1 text-2xl font-semibold text-slate-900">
                                {analytics.ticketsToday}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-amber-50 p-2">
                            <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Avg wait time
                            </div>
                            <div className="mt-1 text-2xl font-semibold text-slate-900">
                                {analytics.avgWaitMinutes}
                                <span className="ml-1 text-sm font-normal text-slate-500">min</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    )
}