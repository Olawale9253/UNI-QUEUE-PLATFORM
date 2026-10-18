import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Calendar, Ticket, FileText, CheckCircle2, Building2,
    Route as RouteIcon, ArrowRight, Clock, ChevronRight
} from 'lucide-react'
import api from '../../api/axios'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { groupQueuesByOffice } from '../../lib/groupQueues'
import { useAuthStore } from '../../store/authStore'

/* ─────────────────────────────────────────────────────────────
   Stat Card Component (Matches the 4 top cards in the image)
   ───────────────────────────────────────────────────────────── */
function StatTile({ label, value, icon: Icon, colorTheme }) {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorMap[colorTheme]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   Queue Card Component (Matches the "Popular Services" grid)
   ───────────────────────────────────────────────────────────── */
function ServiceQueueCard({ office }) {
    const hasQueue = office.queue != null
    const isOpen = hasQueue && office.queue?.isOpen === true
    const waitingCount = office.queue?.waitingCount ?? 0
    const avgWait = office.queue?.estimatedMinutes ?? 0

    // Map colors based on name (just for visual variety like the image)
    const colorTheme = office.name.toLowerCase().includes('bursary') ? 'blue' :
        office.name.toLowerCase().includes('library') ? 'green' :
            office.name.toLowerCase().includes('hostel') ? 'orange' : 'purple'

    const colorMap = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
    }

    return (
        <div className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
            <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${colorMap[colorTheme]}`}>
                    <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900">{office.name}</h3>
                    <p className="mt-1 text-xs text-slate-500 truncate">
                        {isOpen ? `${waitingCount} currently waiting` : 'Closed'}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="text-xs font-medium text-slate-500">
                    Wait: <strong className="text-slate-900">{isOpen ? `${avgWait} min` : '—'}</strong>
                </div>
                <Link
                    to="/student/queues"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                    Join Queue
                    <ChevronRight className="h-3 w-3" />
                </Link>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   Active Clearance Card (Matches the "My Queue Position" card)
   ───────────────────────────────────────────────────────────── */
function ActiveClearanceCard({ data }) {
    const pct = data.progressPercent ?? 0
    const next = data.nextAction

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <RouteIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">{data.workflowName}</h2>
                        <p className="text-xs text-slate-500">Session {data.session || 'Current'}</p>
                    </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Active</span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
                <div>
                    <p className="text-xs font-medium text-slate-500">Progress</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{pct}%</p>
                    <p className="text-xs text-slate-400">{data.completedSteps} of {data.totalSteps} steps</p>
                </div>
                <div className="md:col-span-2">
                    <p className="text-xs font-medium text-slate-500">Next Step</p>
                    {next ? (
                        <>
                            <p className="mt-1 text-lg font-bold text-slate-900">{next.label || next.queueName}</p>
                            <p className="text-xs text-slate-500">{next.officeName}</p>
                        </>
                    ) : (
                        <p className="mt-1 text-sm text-slate-400">No pending steps</p>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-blue-600"
                    />
                </div>
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Started</span>
                        <div className="h-0.5 w-8 bg-blue-600"></div>
                        <span className="font-semibold text-blue-600">In Progress</span>
                        <div className="h-0.5 w-8 bg-slate-200"></div>
                        <span>Completed</span>
                    </div>
                    <Link
                        to="/student/clearance"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        Continue
                    </Link>
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────── */
export default function StudentHome() {
    const { user } = useAuthStore()
    const [queues, setQueues] = useState([])
    const [stats, setStats] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [documents, setDocuments] = useState([])
    const [activeClearance, setActiveClearance] = useState(null)
    const [loading, setLoading] = useState(true)

    const sawInProgressRef = useRef(false)

    const load = useCallback(async () => {
        try {
            const [queue, stringValue, firstValue, dateValue, mp] = await Promise.all([
                api.get('/api/queues').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/stats').catch(() => ({ data: { data: null } })),
                api.get('/api/user/appointments').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/documents').catch(() => ({ data: { data: [] } })),
                api.get('/api/student/workflows/my-progress').catch(() => ({ data: { data: null } })),
            ])
            setQueues(queue.data?.data || [])
            setStats(stringValue.data?.data || null)
            setAppointments(firstValue.data?.data || [])
            setDocuments(dateValue.data?.data || [])

            const mpData = mp.data?.data || null
            if (mpData && mpData.status === 'IN_PROGRESS') {
                sawInProgressRef.current = true
                setActiveClearance(mpData)
            } else if (mpData && mpData.status === 'COMPLETED') {
                if (sawInProgressRef.current) {
                    setActiveClearance(mpData)
                } else {
                    setActiveClearance(null)
                }
            } else {
                setActiveClearance(null)
            }
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    const liveQueues = useMemo(() => {
        const groups = groupQueuesByOffice(queues.filter((queue) => queue.isActive !== false))
        return groups
            .map((group) => {
                const sorted = [...group.queues].sort(
                    (firstValue, secondValue) => (secondValue.waitingCount ?? 0) - (firstValue.waitingCount ?? 0)
                )
                return {
                    key: group.key,
                    name: group.label,
                    queue: sorted[0] || null,
                }
            })
            .sort((firstValue, secondValue) => firstValue.name.localeCompare(secondValue.name))
    }, [queues])

    const myAppointments = appointments.filter(
        (appointment) => appointment.status === 'BOOKED' || appointment.status === 'CONFIRMED'
    ).length
    const myQueueTickets = stats?.hasActiveTicket ? 1 : stats?.todayJoined ?? 0
    const myDocuments = documents.length
    const completedTasks = stats?.totalCompleted ?? 0
    const avgWaitTime = liveQueues.length > 0 ? Math.round(liveQueues.reduce((acc, q) => acc + (q.queue?.estimatedMinutes || 0), 0) / liveQueues.length) : 0

    const firstName = user?.fullName?.split(' ')[0] || 'Student'

    return (
        <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Good morning, {firstName} 👋</h1>
                <p className="mt-1 text-sm text-slate-500">Welcome back to UniFlow. Here's what's happening at your university today.</p>
            </div>

            {/* Stat Cards Grid */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="My Queue Tickets" value={myQueueTickets} icon={Ticket} colorTheme="blue" />
                <StatTile label="Your Appointments" value={myAppointments} icon={Calendar} colorTheme="green" />
                <StatTile label="Average Wait Time" value={`${avgWaitTime} min`} icon={Clock} colorTheme="orange" />
                <StatTile label="Completed Tasks" value={completedTasks} icon={CheckCircle2} colorTheme="purple" />
            </div>

            {/* Active Clearance (My Progress) */}
            {activeClearance && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">My Queue Position</h2>
                        <Link to="/student/workflows" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                            View all history →
                        </Link>
                    </div>
                    <ActiveClearanceCard data={activeClearance} />
                </motion.div>
            )}

            {/* Popular Services (Live Queues) */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Popular Services</h2>
                    <Link to="/student/queues" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        View all queues →
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                ) : liveQueues.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                            <Building2 className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">No services available</p>
                        <p className="mt-1 text-xs text-slate-500">Check back soon. Your university hasn't opened any queues yet.</p>
                    </div>
                ) : (
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={{ initial: {}, animate: { transition: { staggerChildren: 0.05 } } }}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        {liveQueues.map((liveQueue) => (
                            <motion.div
                                key={liveQueue.key}
                                variants={{ initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } }}
                            >
                                <ServiceQueueCard office={liveQueue} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}