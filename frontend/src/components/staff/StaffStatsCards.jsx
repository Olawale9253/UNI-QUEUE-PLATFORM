import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck, ListOrdered, FileText, CheckCircle2 } from 'lucide-react'
import api from '../../api/axios'
import Card from '../ui/Card'
import { SkeletonStats } from '../ui/Skeleton'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

const TILE_DELAYS = [0, 0.05, 0.1, 0.15]

function StatTile({ label, value, icon: Icon, accent, valueColor, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {label}
                        </div>
                        <div className={`mt-3 text-3xl font-bold tracking-tight ${valueColor}`}>
                            {value}
                        </div>
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
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)
    const [apptStats, setApptStats] = useState(null)
    const [docStats, setDocStats] = useState(null)
    const [pendingQueues, setPendingQueues] = useState(0)

    const load = useCallback(async () => {
        try {
            const [stringValue, firstValue, dateValue, queue] = await Promise.all([
                api.get('/api/staff/stats').catch(() => ({ data: { data: null } })),
                api.get('/api/staff/appointments/stats').catch(() => ({ data: { data: null } })),
                api.get('/api/staff/documents/stats').catch(() => ({ data: { data: null } })),
                api.get('/api/staff/queues').catch(() => ({ data: { data: [] } })),
            ])
            setStats(stringValue.data?.data || null)
            setApptStats(firstValue.data?.data || null)
            setDocStats(dateValue.data?.data || null)

            const queues = queue.data?.data || []
            setPendingQueues(queues.reduce((sum, qu) => sum + (qu.waitingCount ?? 0), 0))
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    if (loading) return <SkeletonStats count={4} />

    return (
        <div className="mb-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile
                label="Today's Appointments"
                value={apptStats?.today ?? 0}
                icon={CalendarCheck}
                accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                valueColor="text-violet-600 dark:text-violet-400"
                delay={TILE_DELAYS[0]}
            />
            <StatTile
                label="Pending Queues"
                value={pendingQueues}
                icon={ListOrdered}
                accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                valueColor="text-amber-600 dark:text-amber-400"
                delay={TILE_DELAYS[1]}
            />
            <StatTile
                label="Pending Documents"
                value={docStats?.pending ?? 0}
                icon={FileText}
                accent="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                valueColor="text-purple-600 dark:text-purple-400"
                delay={TILE_DELAYS[2]}
            />
            <StatTile
                label="Completed Today"
                value={stats?.servedToday ?? 0}
                icon={CheckCircle2}
                accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                valueColor="text-emerald-600 dark:text-emerald-400"
                delay={TILE_DELAYS[3]}
            />
        </div>
    )
}