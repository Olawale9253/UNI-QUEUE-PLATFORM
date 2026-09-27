import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ListOrdered, Building2, History, Calendar, ArrowRight, Sparkles,
    MapPin, Users, Clock, Activity, GraduationCap,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import UserStatsCards from '../../components/student/UserStatsCards'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { useAuthStore } from '../../store/authStore'

const QUICK_ACTIONS = [
    { to: '/student/queues', label: 'Browse Queues', description: 'Join a queue and get a ticket in seconds.', icon: ListOrdered, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400' },
    { to: '/student/offices', label: 'Office Directory', description: 'See every office, its queues, and the staff serving them.', icon: Building2, accent: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
    { to: '/student/appointments', label: 'Book an Appointment', description: 'Reserve a slot instead of waiting in line.', icon: Calendar, accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { to: '/student/history', label: 'Your History', description: 'Review your past tickets and wait times.', icon: History, accent: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
]

function LiveQueueCard({ queue }) {
    return (
        <Link to="/student/queues" className="group block transition-transform hover:-translate-y-0.5">
            <Card className="flex h-full flex-col">
                <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{queue.name}</h3>
                    {queue.matricRequired && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <GraduationCap className="mr-0.5 inline h-2.5 w-2.5" />
              Matric
            </span>
                    )}
                </div>

                {queue.department && (
                    <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        <Building2 className="h-3 w-3 shrink-0" />{queue.department}
                    </p>
                )}
                {queue.location && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3 shrink-0" />{queue.location}
                    </p>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-slate-500">
                            <Users className="h-2.5 w-2.5" /> In queue
                        </div>
                        <div className="mt-0.5 text-base font-semibold text-brand-600 dark:text-brand-400">
                            {queue.waitingCount ?? 0}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-slate-500">
                            <Clock className="h-2.5 w-2.5" /> ~Wait
                        </div>
                        <div className="mt-0.5 text-base font-semibold text-amber-600 dark:text-amber-400">
                            {queue.estimatedMinutes ?? 0}<span className="ml-0.5 text-[10px] font-normal text-slate-500">m</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-slate-500">
                            <Activity className="h-2.5 w-2.5" /> Serving
                        </div>
                        <div className="mt-0.5 truncate font-mono text-base font-semibold text-emerald-600 dark:text-emerald-400">
                            {queue.currentlyServing || '—'}
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    )
}

export default function StudentHome() {
    const { user } = useAuthStore()
    const firstName = user?.fullName?.split(' ')[0] || 'there'

    const [queues, setQueues] = useState([])
    const [queuesLoading, setQueuesLoading] = useState(true)

    const loadQueues = useCallback(async () => {
        try {
            const res = await api.get('/api/queues')
            setQueues(res.data?.data || [])
        } catch {
            // silent
        } finally {
            setQueuesLoading(false)
        }
    }, [])

    useEffect(() => { loadQueues() }, [loadQueues])

    useAdaptivePoll(loadQueues, { fastMs: 5000, slowMs: 15000 })

    const liveQueues = [...queues]
        .filter((q) => q.isActive !== false)
        .sort((a, b) => (b.waitingCount ?? 0) - (a.waitingCount ?? 0))

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    Student Workspace
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                    Hi, {firstName}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Skip the line — join a queue from anywhere and get notified when it's your turn.
                </p>
            </motion.div>

            <UserStatsCards />

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Live queues</h2>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {liveQueues.length} open now · auto-refreshing
                        </p>
                    </div>
                    <Link to="/student/queues" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                        View all
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {queuesLoading ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                        ))}
                    </div>
                ) : liveQueues.length === 0 ? (
                    <Card>
                        <div className="py-8 text-center">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <ListOrdered className="h-5 w-5 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No open queues</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Check back shortly — your university hasn't opened any queues yet.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={{ initial: {}, animate: { transition: { staggerChildren: 0.03 } } }}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {liveQueues.slice(0, 9).map((q) => (
                            <motion.div
                                key={q.id}
                                variants={{ initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } }}
                            >
                                <LiveQueueCard queue={q} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Quick actions</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {QUICK_ACTIONS.map((a, i) => {
                        const Icon = a.icon
                        return (
                            <motion.div
                                key={a.to}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.05 }}
                            >
                                <Link to={a.to} className="group block">
                                    <Card className="flex h-full items-start gap-4 transition-transform hover:-translate-y-0.5">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${a.accent}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{a.label}</h3>
                                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                                            </div>
                                            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{a.description}</p>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>
            </motion.div>
        </>
    )
}