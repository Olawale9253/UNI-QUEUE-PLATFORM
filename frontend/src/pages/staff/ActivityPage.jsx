import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Ticket, CheckCircle2, TrendingUp, Clock, Award, Activity,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonStats } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'

function StatCard({ label, value, hint, icon: Icon, accent }) {
    return (
        <Card className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {label}
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        {value}
                    </div>
                    {hint && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
                </div>
                {Icon && (
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>
        </Card>
    )
}

export default function ActivityPage() {
    const { push } = useToastStore()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        api
            .get('/api/staff/stats')
            .then((res) => { if (!cancelled) setStats(res.data?.data || null) })
            .catch((err) => { if (!cancelled) push({ type: 'error', message: err.response?.data?.message || 'Failed to load activity' }) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [push])

    if (loading) {
        return (
            <>
                <PageHeader title="Activity" description="Your service history at a glance." />
                <SkeletonStats count={4} />
            </>
        )
    }

    if (!stats) {
        return (
            <>
                <PageHeader title="Activity" description="Your service history at a glance." />
                <Card>
                    <div className="py-10 text-center text-sm text-slate-500">
                        No activity data available yet.
                    </div>
                </Card>
            </>
        )
    }

    // Compute a simple 7-day average
    const weekAvg = stats.servedThisWeek > 0
        ? Math.round((stats.servedThisWeek / 7) * 10) / 10
        : 0

    return (
        <>
            <PageHeader
                title="Activity"
                description="Your service history, productivity, and customer satisfaction."
            />

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
            >
                <StatCard
                    label="Now serving"
                    value={stats.currentlyServing || '—'}
                    hint={stats.currentlyServingQueue || 'No active ticket'}
                    icon={Ticket}
                    accent="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                />
                <StatCard
                    label="Served today"
                    value={stats.servedToday}
                    hint={stats.servedToday === 1 ? 'ticket' : 'tickets'}
                    icon={CheckCircle2}
                    accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                />
                <StatCard
                    label="This week"
                    value={stats.servedThisWeek}
                    hint={`${weekAvg}/day avg`}
                    icon={TrendingUp}
                    accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                />
                <StatCard
                    label="All time"
                    value={stats.servedAllTime}
                    hint="Total completed"
                    icon={Award}
                    accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                />
            </motion.div>

            {/* Performance block */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Avg service time
                            </div>
                            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                {stats.avgServiceMinutes} <span className="text-sm font-normal text-slate-500">min per ticket</span>
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Lower is faster. This is measured from when you start serving to when you complete.
                    </p>
                </Card>

                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40">
                            <Activity className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Weekly pace
                            </div>
                            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                {weekAvg} <span className="text-sm font-normal text-slate-500">tickets/day</span>
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Your rolling 7-day average. Aim to keep it steady across the week.
                    </p>
                </Card>
            </motion.div>
        </>
    )
}