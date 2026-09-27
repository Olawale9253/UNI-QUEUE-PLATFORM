import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Ticket, CheckCircle2, TrendingUp, Clock, Award, Activity,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonStats } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

const TILE_DELAYS = [0, 0.04, 0.08, 0.12]

function StatCard({ label, value, hint, icon: Icon, accent, valueColor, delay }) {
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
                        <div className={`mt-2 truncate text-2xl font-bold tracking-tight ${valueColor}`}>
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

export default function ActivityPage() {
    const { push } = useToastStore()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/staff/stats')
            setStats(res.data?.data || null)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load activity' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

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

    const weekAvg = stats.servedThisWeek > 0
        ? Math.round((stats.servedThisWeek / 7) * 10) / 10
        : 0

    const nowServingValue = stats.currentlyServing || '0'

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
                    value={nowServingValue}
                    hint={stats.currentlyServingQueue || 'No active ticket'}
                    icon={Ticket}
                    accent="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                    valueColor={
                        stats.currentlyServing
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-400 dark:text-slate-500'
                    }
                    delay={TILE_DELAYS[0]}
                />
                <StatCard
                    label="Served today"
                    value={stats.servedToday}
                    hint={stats.servedToday === 1 ? 'ticket' : 'tickets'}
                    icon={CheckCircle2}
                    accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    valueColor="text-emerald-600 dark:text-emerald-400"
                    delay={TILE_DELAYS[1]}
                />
                <StatCard
                    label="This week"
                    value={stats.servedThisWeek}
                    hint={`${weekAvg}/day avg`}
                    icon={TrendingUp}
                    accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                    valueColor="text-sky-600 dark:text-sky-400"
                    delay={TILE_DELAYS[2]}
                />
                <StatCard
                    label="All time"
                    value={stats.servedAllTime}
                    hint="Total completed"
                    icon={Award}
                    accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                    valueColor="text-violet-600 dark:text-violet-400"
                    delay={TILE_DELAYS[3]}
                />
            </motion.div>

            {/* Secondary metrics */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
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
                            <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {stats.avgServiceMinutes}{' '}
                                <span className="text-sm font-normal text-slate-500">min per ticket</span>
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
                            <div className="mt-1 text-2xl font-bold text-sky-600 dark:text-sky-400">
                                {weekAvg}{' '}
                                <span className="text-sm font-normal text-slate-500">tickets/day</span>
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