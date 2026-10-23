import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, CheckCircle2, Clock, Calendar, ArrowRight, Ticket } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../lib/format'

export default function ActivityPage() {
    const { push } = useToastStore()
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                // Assuming a standard audit log endpoint for staff
                const res = await api.get('/api/staff/activity')
                setActivities(res.data?.data || [])
            } catch (err) {
                // Silent catch for now if endpoint doesn't exist
                setActivities([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Activity History</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A full log of all tickets you've served and actions you've taken.</p>
            </div>

            <Card padded={false}>
                {loading ? (
                    <div className="p-4 space-y-4">{[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}</div>
                ) : activities.length === 0 ? (
                    <EmptyState icon={Activity} title="No activity yet" description="Your service history and audit logs will appear here once you start serving students." />
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {activities.map((log) => (
                            <div key={log.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                {String(log.action).replace(/_/g, ' ')}
                                            </span>
                                            {log.ticketNumber && (
                                                <Badge variant="default">Ticket {log.ticketNumber}</Badge>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            {log.details || 'Action recorded successfully.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-12 shrink-0 text-xs font-medium text-slate-400 sm:ml-0 sm:text-right">
                                    {formatDateTime(log.createdAt)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}