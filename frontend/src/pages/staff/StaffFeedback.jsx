import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    Star, MessageSquare, TrendingUp, TrendingDown, Minus,
    ThumbsUp, Building2, Quote, RefreshCw, Loader2,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../lib/format'

function StarRow({ rating, size = 'h-4 w-4' }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${size} ${
                        star <= Math.round(rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                    }`}
                />
            ))}
        </div>
    )
}

export default function StaffFeedback() {
    const { push } = useToastStore()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const load = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true)
        else setLoading(true)
        try {
            const res = await api.get('/api/staff/feedback/me')
            setData(res.data?.data || null)
        } catch (err) {
            // 404 = staff hasn't been rated yet; that's fine
            if (err.response?.status === 404) {
                setData(null)
            } else {
                push({ type: 'error', message: err.message || 'Failed to load feedback' })
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    const stats = useMemo(() => {
        if (!data) return null
        const { avgRating, totalRatings, thisMonthAvg, thisMonthCount, lastMonthAvg, positivePercent } = data
        const trend = lastMonthAvg && thisMonthAvg
            ? Number(thisMonthAvg) - Number(lastMonthAvg)
            : null
        return { avgRating, totalRatings, thisMonthAvg, thisMonthCount, lastMonthAvg, positivePercent, trend }
    }, [data])

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                    ))}
                </div>
            </div>
        )
    }

    // No feedback yet
    if (!data || (data.totalRatings ?? 0) === 0) {
        return (
            <div className="space-y-8 pb-12">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My Feedback</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Student ratings for services you've served.
                    </p>
                </div>
                <EmptyState
                    icon={MessageSquare}
                    title="No ratings yet"
                    description="Once students complete a ticket and rate the service you handled, their feedback will appear here."
                />
            </div>
        )
    }

    const trendIcon = stats.trend === null
        ? Minus
        : stats.trend > 0
            ? TrendingUp
            : stats.trend < 0
                ? TrendingDown
                : Minus

    const trendColor = stats.trend === null
        ? 'text-slate-400'
        : stats.trend > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : stats.trend < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500'

    const trendLabel = stats.trend === null
        ? 'No prior data'
        : stats.trend > 0
            ? `+${stats.trend.toFixed(1)} vs last month`
            : stats.trend < 0
                ? `${stats.trend.toFixed(1)} vs last month`
                : 'Same as last month'

    const TrendIcon = trendIcon

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My Feedback</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Student ratings for services you've served.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    icon={refreshing ? Loader2 : RefreshCw}
                    onClick={() => load(true)}
                    disabled={refreshing}
                >
                    Refresh
                </Button>
            </div>

            {/* Hero card — this month's rating */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="relative overflow-hidden">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                This month
                            </p>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                                    {Number(stats.thisMonthAvg ?? stats.avgRating).toFixed(1)}
                                </span>
                                <span className="text-lg font-semibold text-slate-400">/ 5.0</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <StarRow rating={Number(stats.thisMonthAvg ?? stats.avgRating)} size="h-4 w-4" />
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    from {stats.thisMonthCount ?? stats.totalRatings} ratings
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-start gap-1 sm:items-end">
                            <div className={`flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold dark:bg-slate-800 ${trendColor}`}>
                                <TrendIcon className="h-3.5 w-3.5" />
                                {trendLabel}
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                                All-time: {Number(stats.avgRating).toFixed(1)} avg
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Total ratings', value: stats.totalRatings ?? 0, icon: MessageSquare, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950/40' },
                    { label: 'Positive reviews', value: `${stats.positivePercent ?? 0}%`, icon: ThumbsUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
                    { label: 'Services rated', value: data.perQueue?.length ?? 0, icon: Building2, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/40' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Per-queue breakdown */}
            {data.perQueue?.length > 0 && (
                <div>
                    <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Rating by service</h2>
                    <Card padded={false}>
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {data.perQueue.map((q) => {
                                const pct = Math.min(100, (Number(q.avgRating) / 5) * 100)
                                return (
                                    <li key={q.queueId} className="flex items-center gap-4 p-4 sm:px-6">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                            <Building2 className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {q.queueName}
                                                    {q.officeName && (
                                                        <span className="ml-2 text-xs font-medium text-slate-400">
                                                            · {q.officeName}
                                                        </span>
                                                    )}
                                                </p>
                                                <span className="shrink-0 text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    {Number(q.avgRating).toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                {q.totalRatings} rating{q.totalRatings === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </Card>
                </div>
            )}

            {/* Recent comments */}
            {data.recentComments?.length > 0 && (
                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <Quote className="h-4 w-4 text-slate-400" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent comments</h2>
                    </div>
                    <div className="space-y-3">
                        {data.recentComments.map((c) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card>
                                    <div className="flex items-start justify-between gap-3">
                                        <StarRow rating={c.rating} />
                                        <span className="text-[11px] text-slate-400">
                                            {formatDateTime(c.createdAt)}
                                        </span>
                                    </div>
                                    {c.comment ? (
                                        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                            "{c.comment}"
                                        </p>
                                    ) : (
                                        <p className="mt-3 text-sm italic text-slate-400">
                                            No written comment.
                                        </p>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}