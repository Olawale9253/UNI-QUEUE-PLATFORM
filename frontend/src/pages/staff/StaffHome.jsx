import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ListOrdered, CalendarCheck, FileText, ArrowRight, Ticket,
    Clock, ChevronRight,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StaffStatsCards from '../../components/staff/StaffStatsCards'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { useToastStore } from '../../store/toastStore'

const STATUS_VARIANTS = {
    WAITING: 'warning',
    WAITLISTED: 'info',
    CALLED: 'indigo',
    SERVING: 'indigo',
    COMPLETED: 'success',
    NO_SHOW: 'danger',
    CANCELLED: 'default',
    TRANSFERRED: 'default',
}

const STATUS_LABELS = {
    WAITING: 'Waiting',
    WAITLISTED: 'Waitlisted',
    CALLED: 'Called',
    SERVING: 'Serving',
    COMPLETED: 'Completed',
    NO_SHOW: 'No-show',
    CANCELLED: 'Cancelled',
    TRANSFERRED: 'Transferred',
}

const QUICK_ACTIONS = [
    {
        to: '/staff/serving',
        label: 'Manage Queues',
        description: 'Call tickets and serve students',
        icon: ListOrdered,
        accent: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400',
    },
    {
        to: '/staff/appointments',
        label: 'View Appointments',
        description: 'See appointments booked with you',
        icon: CalendarCheck,
        accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
        to: '/staff/documents',
        label: 'Process Documents',
        description: 'Review pending document requests',
        icon: FileText,
        accent: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    },
]

function formatTime(dt) {
    if (!dt) return null
    try {
        return new Date(dt).toLocaleString([], {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return null
    }
}

export default function StaffHome() {
    const navigate = useNavigate()
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [recentTickets, setRecentTickets] = useState([])
    const [ticketsLoading, setTicketsLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const qRes = await api.get('/api/staff/queues')
            const staffQueues = qRes.data?.data || []
            setQueues(staffQueues)

            if (staffQueues.length === 0) {
                setRecentTickets([])
                setTicketsLoading(false)
                return
            }

            const ticketsByQueue = await Promise.all(
                staffQueues.map((staffQueue) =>
                    api
                        .get(`/api/staff/queues/${staffQueue.id}/tickets`)
                        .then((res) => res.data?.data || [])
                        .catch(() => [])
                )
            )
            const all = ticketsByQueue.flat()

            const sorted = all
                .sort((leftValue, rightValue) => {
                    const at = leftValue.joinedAt ? new Date(leftValue.joinedAt).getTime() : 0
                    const bt = rightValue.joinedAt ? new Date(rightValue.joinedAt).getTime() : 0
                    return bt - at
                })
                .slice(0, 5)

            setRecentTickets(sorted)
        } catch (err) {
            push({
                type: 'error',
                message: err.message || 'Failed to load data',
            })
        } finally {
            setTicketsLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    return (
        <>
            <StaffStatsCards />

            {/* ─── 3 Quick Actions ─── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                {QUICK_ACTIONS.map((item, index) => {
                    const Icon = item.icon
                    return (
                        <motion.div
                            key={item.to}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + index * 0.05 }}
                        >
                            <Link to={item.to} className="group block h-full">
                                <Card className="flex h-full items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.accent}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {item.label}
                                            </h3>
                                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                            {item.description}
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* ─── Recent Queue Tickets ─── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
            >
                <Card padded={false}>
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            Recent Queue Tickets
                        </h2>
                        <button
                            onClick={() => navigate('/staff/activity')}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
                        >
                            View all
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {ticketsLoading ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {Array.from({ length: 3 }).map((unusedValue, indexValue) => (
                                <div key={indexValue} className="flex items-center gap-4 px-6 py-4">
                                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                </div>
                            ))}
                        </div>
                    ) : recentTickets.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <Ticket className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                No tickets yet
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Tickets from students will show up here.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentTickets.map((recentTicket) => (
                                <li
                                    key={recentTicket.id}
                                    className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {recentTicket.queueName || recentTicket.officeName || 'Service'}
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-mono">
                                                Ticket: {recentTicket.ticketNumber}
                                            </span>
                                            {recentTicket.userFullName && (
                                                <span>· {recentTicket.userFullName}</span>
                                            )}
                                            {recentTicket.joinedAt && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTime(recentTicket.joinedAt)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant={STATUS_VARIANTS[recentTicket.status] || 'default'}>
                                        {STATUS_LABELS[recentTicket.status] || recentTicket.status}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </motion.div>
        </>
    )
}