import { useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Calendar, Building2, Ticket, CheckCircle2,
    FileText, Users, ArrowRight, ChevronRight, Bell,
    Clock, Sparkles, ArrowUpRight, Activity, ShieldCheck
} from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { getInitials } from '../../lib/format'

function formatActivityDate(dt) {
    if (!dt) return 'Recent'
    try {
        return new Date(dt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
        return 'Recent'
    }
}

export default function StudentHome() {
    const { user } = useAuthStore()
    const { university } = useUniversityStore()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [activeTicket, setActiveTicket] = useState(null)
    const [queues, setQueues] = useState([])
    const [appointments, setAppointments] = useState([])
    const [notifications, setNotifications] = useState([])
    const [history, setHistory] = useState([])

    const load = useCallback(async () => {
        try {
            const [ticketRes, queueRes, apptRes, notifRes, historyRes] = await Promise.all([
                api.get('/api/user/tickets/active').catch(() => ({ data: { data: null } })),
                api.get('/api/queues').catch(() => ({ data: { data: [] } })),
                api.get('/api/appointments').catch(() => ({ data: { data: [] } })),
                api.get('/api/notifications').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/tickets/history').catch(() => ({ data: { data: [] } }))
            ])

            setActiveTicket(ticketRes.data?.data)
            setQueues(queueRes.data?.data || [])
            setAppointments(apptRes.data?.data || [])
            setNotifications(notifRes.data?.data || [])
            setHistory(historyRes.data?.data || [])
        } catch (err) {
            console.error('Dashboard load error', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useAdaptivePoll(load, { fastMs: 10000, slowMs: 30000 })

    const unreadNotifs = notifications.filter(n => !n.isRead).length
    const upcomingAppts = appointments.filter(a => new Date(a.date) >= new Date()).length
    const topQueues = queues.slice(0, 4)
    const recentActivity = history.slice(0, 4)

    if (loading) {
        return (
            <div className="flex h-72 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
                    <p className="text-xs font-semibold text-slate-400">Loading student workspace...</p>
                </div>
            </div>
        )
    }

    const studentIdentifier = user?.matricNumber || user?.jambNumber || (user?.role === 'FRESHER' ? 'Fresher Admission' : 'Student')
    const departmentName = user?.department || 'General Academic'

    return (
        <div className="space-y-6 px-4 sm:px-6">
            {/* ACTIVE TICKET BANNER OR WELCOME SPOTLIGHT */}
            {activeTicket ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="relative overflow-hidden rounded-3xl border border-brand-200/90 bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 p-6 text-white shadow-xl shadow-brand-600/15 sm:p-7"
                >
                    <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute -bottom-16 -left-12 h-64 w-64 rounded-full bg-brand-400/20 blur-2xl" />

                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                    Active Ticket in Progress
                                </span>
                                {activeTicket.counterName && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/25 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                        Desk: {activeTicket.counterName}
                                    </span>
                                )}
                            </div>

                            <div>
                                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    {activeTicket.queueName || 'Campus Service Queue'}
                                </h2>
                                <p className="mt-1 flex items-center gap-2 text-sm text-brand-100">
                                    <Building2 className="h-4 w-4 shrink-0 text-brand-200" />
                                    {activeTicket.officeName || 'Administrative Office'}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs sm:text-sm text-brand-100/90">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-brand-200" />
                                    <span>
                                        Est. wait: <strong className="text-white">{activeTicket.estimatedMinutes ? `${activeTicket.estimatedMinutes} mins` : 'Calculating...'}</strong>
                                    </span>
                                </div>
                                <div className="hidden h-3 w-px bg-white/20 sm:block" />
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-4 w-4 text-brand-200" />
                                    <span>
                                        Queue Position: <strong className="text-white">#{activeTicket.position ?? '—'}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-md border border-white/15">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-200">Ticket Number</p>
                                <p className="mt-0.5 text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                                    {activeTicket.ticketNumber || 'T-ACTIVE'}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/student/my-tickets')}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-brand-900 shadow-md transition-all hover:bg-brand-50 hover:shadow-lg active:scale-[0.99]"
                            >
                                Track Ticket
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-brand-50/30 to-indigo-50/40 p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/20">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                    No Active Queue Ticket
                                </h3>
                                <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                                    You are not currently waiting in line. Explore available campus offices or join a queue in real time without standing in physical lines.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/student/queues')}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
                        >
                            Browse Queues
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN DASHBOARD CONTENT & RIGHT RAIL */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                <div className="space-y-6">

                    {/* QUICK ACTIONS */}
                    <div>
                        <div className="flex items-center justify-between mb-3.5">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                Quick Actions
                            </h2>
                            <span className="text-xs font-semibold text-slate-400">Campus Services</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                {
                                    label: 'Join Queue',
                                    desc: 'Take an instant ticket for any office',
                                    icon: Users,
                                    color: 'text-blue-600 dark:text-blue-400',
                                    bg: 'bg-blue-50 dark:bg-blue-950/50',
                                    ring: 'group-hover:border-blue-200 dark:group-hover:border-blue-800',
                                    path: '/student/queues'
                                },
                                {
                                    label: 'Book Appointment',
                                    desc: 'Schedule dedicated time with officers',
                                    icon: Calendar,
                                    color: 'text-emerald-600 dark:text-emerald-400',
                                    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
                                    ring: 'group-hover:border-emerald-200 dark:group-hover:border-emerald-800',
                                    path: '/student/appointments'
                                },
                                {
                                    label: 'Campus Offices',
                                    desc: 'View hours, active desks and staff',
                                    icon: Building2,
                                    color: 'text-purple-600 dark:text-purple-400',
                                    bg: 'bg-purple-50 dark:bg-purple-950/50',
                                    ring: 'group-hover:border-purple-200 dark:group-hover:border-purple-800',
                                    path: '/student/offices'
                                },
                                {
                                    label: 'My Tickets',
                                    desc: 'Track live spot and ticket history',
                                    icon: Ticket,
                                    color: 'text-amber-600 dark:text-amber-400',
                                    bg: 'bg-amber-50 dark:bg-amber-950/50',
                                    ring: 'group-hover:border-amber-200 dark:group-hover:border-amber-800',
                                    path: '/student/my-tickets'
                                },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(action.path)}
                                    className={`group flex flex-col items-start p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-left dark:bg-slate-900 dark:border-slate-800 ${action.ring}`}
                                >
                                    <div className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl mb-3 sm:mb-4 transition-transform group-hover:scale-105 ${action.bg} ${action.color}`}>
                                        <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                        {action.label}
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3 line-clamp-2 leading-relaxed">
                                        {action.desc}
                                    </p>
                                    <div className="mt-auto flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                        <span>Open</span>
                                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* STATS OVERVIEW ROW */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Ticket</p>
                                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {activeTicket ? 1 : 0}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {activeTicket ? 'Currently waiting' : 'No active queue'}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center dark:bg-blue-950/50 dark:text-blue-400">
                                <Ticket className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Appointments</p>
                                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {upcomingAppts}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {upcomingAppts === 1 ? '1 scheduled' : `${upcomingAppts} scheduled`}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/50 dark:text-emerald-400">
                                <Calendar className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Services</p>
                                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {queues.length}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Available on campus
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/50 dark:text-purple-400">
                                <FileText className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alerts</p>
                                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {unreadNotifs}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {unreadNotifs === 0 ? 'All caught up' : 'Unread updates'}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center dark:bg-amber-950/50 dark:text-amber-400">
                                <Bell className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    {/* DUAL SECTION: UPCOMING QUEUES & RECENT ACTIVITY */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* QUEUE ACTIVITY */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
                            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                        Upcoming Queues
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                                        Your active ticket and queue progress
                                    </p>
                                </div>
                                <Link
                                    to="/student/my-tickets"
                                    className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1"
                                >
                                    View All <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>

                            <div className="p-3 sm:p-4 flex-1">
                                {activeTicket ? (
                                    <div className="rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/50 dark:bg-slate-800/40 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center dark:bg-brand-950/50 dark:text-brand-400">
                                                    <Ticket className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                                        {activeTicket.queueName}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {activeTicket.officeName}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Position #{activeTicket.position ?? 1}
                                            </span>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">
                                                Estimated Wait: <strong className="text-slate-800 dark:text-slate-200">{activeTicket.estimatedMinutes ? `${activeTicket.estimatedMinutes} mins` : 'Brief'}</strong>
                                            </span>
                                            <button
                                                onClick={() => navigate('/student/my-tickets')}
                                                className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                            >
                                                Track live →
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            No active queue tickets
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                                            Join any open department queue anytime from your phone or laptop.
                                        </p>
                                        <button
                                            onClick={() => navigate('/student/queues')}
                                            className="mt-3 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                        >
                                            View Open Queues →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RECENT ACTIVITY */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
                            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                        Recent Activity
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                                        Completed visits and queue history
                                    </p>
                                </div>
                                <Link
                                    to="/student/history"
                                    className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1"
                                >
                                    View History <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>

                            <div className="p-3 sm:p-4 flex-1">
                                {recentActivity.length > 0 ? (
                                    <div className="space-y-2">
                                        {recentActivity.map((item, index) => {
                                            const isCompleted = item.status === 'COMPLETED'
                                            return (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                                >
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                                        isCompleted
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                                            {item.queueName || 'Campus Service'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                            {item.officeName || 'Office'} • {item.ticketNumber || 'Ticket'}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                                                        {formatActivityDate(item.createdAt || item.joinedAt)}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            No recent activity logged
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Your completed tickets and appointments will show up here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR COLUMN */}
                <div className="space-y-4 sm:space-y-6">
                    {/* STUDENT ID CARD CARD */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-lg sm:text-xl font-bold text-brand-700 ring-2 ring-brand-500/15 dark:bg-brand-950/60 dark:text-brand-300">
                                {getInitials(user?.fullName)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                                    {user?.fullName || 'Student'}
                                </h3>
                                <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold truncate">
                                    {studentIdentifier}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                    {departmentName}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span>Institution:</span>
                                <strong className="text-slate-800 dark:text-slate-200">{university?.name || university?.code || 'Campus'}</strong>
                            </div>
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span>Role status:</span>
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck className="h-3 w-3" />
                                    {user?.role === 'FRESHER' ? 'Fresher' : 'Enrolled Student'}
                                </span>
                            </div>
                        </div>

                        <Link
                            to="/student/profile"
                            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            View Full Student Profile
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {/* LIVE QUEUES MONITOR */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Live Campus Queues
                                </h3>
                                <p className="text-[11px] text-slate-400">Real-time desk loads</p>
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </span>
                        </div>

                        <div className="p-2 space-y-1">
                            {topQueues.length > 0 ? (
                                topQueues.map(q => (
                                    <div
                                        key={q.id}
                                        onClick={() => navigate('/student/queues')}
                                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/60 dark:group-hover:text-brand-400 transition-colors">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                                    {q.name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate">
                                                    {q.officeName || 'Campus Desk'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                q.isOpen
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                            }`}>
                                                {q.isOpen ? `${q.waitingCount || 0} waiting` : 'Closed'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-xs text-slate-400">
                                    No campus queues currently active.
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
                            <Link
                                to="/student/queues"
                                className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                            >
                                Browse All Campus Services →
                            </Link>
                        </div>
                    </div>

                    {/* USEFUL CAMPUS RESOURCES */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Student Resources
                            </h3>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Links</span>
                        </div>

                        <div className="space-y-1">
                            {[
                                { name: 'Campus Portal', href: 'https://lautech.edu.ng' },
                                { name: 'Academic Calendar', href: '#' },
                                { name: 'Student Handbook & Policies', href: '#' },
                                { name: 'ICT Helpdesk & Support', href: '#' },
                            ].map((res, idx) => (
                                <a
                                    key={idx}
                                    href={res.href}
                                    target={res.href.startsWith('http') ? '_blank' : '_self'}
                                    rel="noreferrer"
                                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                                >
                                    <span>{res.name}</span>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
