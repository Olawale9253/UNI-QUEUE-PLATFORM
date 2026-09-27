import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Ticket, CheckCircle2, TrendingUp, Clock } from 'lucide-react'
import api from '../../api/axios'
import Card from '../ui/Card'
import { SkeletonStats } from '../ui/Skeleton'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

const TILE_DELAYS = [0, 0.05, 0.1, 0.15]

function StatTile({ label, value, hint, icon: Icon, accent, valueColor, delay }) {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
            <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
                        <div className={`mt-2 truncate text-2xl font-bold tracking-tight ${valueColor}`}>{value}</div>
                        {hint && <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
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

export default function StaffStatsCards() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/staff/stats')
            setStats(res.data?.data || null)
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    if (loading) return <SkeletonStats count={4} />
    if (!stats) return null

    const nowServingValue = stats.currentlyServing || '0'

    return (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile
                label="Now serving"
                value={nowServingValue}
                hint={stats.currentlyServingQueue || 'No active ticket'}
                icon={Ticket}
                accent="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                valueColor={stats.currentlyServing ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}
                delay={TILE_DELAYS[0]}
            />
            <StatTile
                label="Served today"
                value={stats.servedToday}
                hint={stats.servedToday === 1 ? 'ticket' : 'tickets'}
                icon={CheckCircle2}
                accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                valueColor="text-emerald-600 dark:text-emerald-400"
                delay={TILE_DELAYS[1]}
            />
            <StatTile
                label="Served this week"
                value={stats.servedThisWeek}
                hint={`${stats.servedAllTime} all time`}
                icon={TrendingUp}
                accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                valueColor="text-sky-600 dark:text-sky-400"
                delay={TILE_DELAYS[2]}
            />
            <StatTile
                label="Avg service time"
                value={`${stats.avgServiceMinutes} min`}
                hint="Per completed ticket"
                icon={Clock}
                accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                valueColor="text-amber-600 dark:text-amber-400"
                delay={TILE_DELAYS[3]}
            />
        </div>
    )
}