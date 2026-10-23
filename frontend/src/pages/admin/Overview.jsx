import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    LayoutGrid,
    Users,
    Ticket,
    Clock,
    MapPin,
    UserCheck,
    Building2,
    Activity,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonStats, SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { groupQueuesByOffice } from '../../lib/groupQueues'
import { stagger, staggerItem } from '../../lib/motion'

export default function Overview() {
    const { user } = useAuthStore()
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [staff, setStaff] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const [queue, firstValue, stringValue] = await Promise.all([
                api.get('/api/admin/queues'),
                api.get('/api/admin/analytics').catch(() => ({ data: { data: null } })),
                api.get('/api/admin/staff').catch(() => ({ data: { data: [] } })),
            ])
            setQueues(queue.data.data || [])
            setAnalytics(firstValue.data.data || null)
            setStaff(stringValue.data.data || [])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <div className="mb-6 h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <SkeletonStats count={4} />
                <div className="mb-8 mt-8 h-6 w-1/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <SkeletonQueueGrid count={3} />
            </div>
        )
    }

    const groups = groupQueuesByOffice(queues)

    // Calculate high-level metrics
    const totalServices = queues.length
    const totalWaiting = queues.reduce((sum, q) => sum + (q.waitingCount || 0), 0)
    const totalStaff = staff.length
    const avgWait = analytics?.avgWaitMinutes || 0

    const STATS = [
        { label: 'Total Services', value: totalServices, icon: LayoutGrid, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950/40' },
        { label: 'Students Waiting', value: totalWaiting, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
        { label: 'Staff Members', value: totalStaff, icon: UserCheck, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/40' },
        { label: 'Avg. Wait Time', value: `${avgWait} min`, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    ]

    const ServiceCard = ({ q: service }) => (
        <motion.div variants={staggerItem}>
            <Card className="h-full flex flex-col">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{service.name}</h3>
                    <Badge variant={service.isActive ? 'success' : 'default'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </div>

                {service.location && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {service.location}
                    </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Users className="h-3 w-3" /> Waiting
                        </div>
                        <div className="mt-1 text-lg font-bold text-brand-600 dark:text-brand-400">
                            {service.waitingCount ?? 0}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Ticket className="h-3 w-3" /> Now Serving
                        </div>
                        <div className="mt-1 text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">
                            {service.currentlyServing || '—'}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <UserCheck className="h-3 w-3" /> Staff
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {service.staffCount ?? 0}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" /> Avg Time
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {service.averageServiceMinutes} min
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    )

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Campus Overview
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Real-time status of all services, staff, and students waiting across your university.
                </p>
            </div>

            {/* KPI Stats Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STATS.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{stat.value}</p>
                            </div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Services by Office */}
            <div>
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live Services</h2>
                </div>

                {queues.length === 0 ? (
                    <EmptyState
                        icon={LayoutGrid}
                        title="No services yet"
                        description="You haven't created any services yet. Head to the Services tab to add one."
                    />
                ) : (
                    <div className="space-y-10">
                        {groups.map((group, groupIdx) => (
                            <motion.section
                                key={group.key}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: groupIdx * 0.05 }}
                            >
                                {/* Office Header */}
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <h4 className="text-base font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                                            {group.label}
                                        </h4>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                            {group.queues.length} {group.queues.length === 1 ? 'service' : 'services'}
                                        </span>
                                    </div>
                                    {group.waitingTotal > 0 && (
                                        <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                            <Users className="h-3.5 w-3.5" />
                                            {group.waitingTotal} waiting total
                                        </span>
                                    )}
                                </div>

                                <motion.div
                                    variants={stagger(0, 0.05)}
                                    initial="initial"
                                    animate="animate"
                                    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                                >
                                    {group.queues.map((item) => (
                                        <ServiceCard key={item.id} q={item} />
                                    ))}
                                </motion.div>
                            </motion.section>
                        ))}
                    </div>
                )}
            </div>

            {/* Staff Section */}
            <div className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Your Staff Members</h2>
                </div>
                {staff.length === 0 ? (
                    <EmptyState
                        icon={UserCheck}
                        title="No staff members"
                        description="Add staff members to serve tickets in your queues."
                    />
                ) : (
                    <Card padded={false}>
                        <motion.ul
                            variants={stagger(0, 0.04)}
                            initial="initial"
                            animate="animate"
                            className="divide-y divide-slate-100 dark:divide-slate-800"
                        >
                            {staff.map((item) => (
                                <motion.li
                                    key={item.id}
                                    variants={staggerItem}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-700">
                                            {item.fullName?.split(' ').map((parameter) => parameter[0]).slice(0, 2).join('')}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {item.fullName}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{item.email}</div>
                                        </div>
                                    </div>
                                    <Badge variant="success">Active</Badge>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Card>
                )}
            </div>
        </div>
    )
}