import { useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    Calendar, Building2, Ticket, CheckCircle2,
    FileText, Users, ArrowRight, ChevronRight, User, Bell
} from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

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
            console.error("Dashboard load error", err)
        } finally {
            setLoading(false)
        }
    }, [])

    useAdaptivePoll(load, { fastMs: 10000, slowMs: 30000 })

    const unreadNotifs = notifications.filter(n => !n.isRead).length
    const upcomingAppts = appointments.filter(a => new Date(a.date) >= new Date()).length
    const topQueues = queues.slice(0, 3)
    const recentActivity = history.slice(0, 3)

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>
    }

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                <div className="space-y-6">

                    {/* QUICK ACTIONS */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Quick Actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                { label: 'Join Queue', desc: 'Join a queue for any service', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/student/queues' },
                                { label: 'Book Appt', desc: 'Schedule a time with staff', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/student/appointments' },
                                { label: 'Find Offices', desc: 'View offices and details', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', path: '/student/offices' },
                                { label: 'My Queues', desc: 'Track your queue position', icon: Ticket, color: 'text-orange-600', bg: 'bg-orange-50', path: '/student/my-tickets' },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(action.path)}
                                    className="group flex flex-col items-start p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-left dark:bg-slate-900 dark:border-slate-800"
                                >
                                    <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl mb-3 sm:mb-4 ${action.bg} ${action.color}`}>
                                        <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">{action.label}</h3>
                                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1 mb-2 sm:mb-4 line-clamp-1">{action.desc}</p>
                                    <ChevronRight className="h-4 w-4 text-slate-400 mt-auto group-hover:translate-x-1 transition-transform" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* STATS ROW */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Active</p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeTicket ? 1 : 0}</p>
                                <p className="text-[9px] sm:text-[11px] text-slate-400 mt-1">{activeTicket ? '1 queue' : 'None'}</p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Ticket className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Appts</p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{upcomingAppts}</p>
                                <p className="text-[9px] sm:text-[11px] text-slate-400 mt-1">Upcoming</p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Services</p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{queues.length}</p>
                                <p className="text-[9px] sm:text-[11px] text-slate-400 mt-1">Available</p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Alerts</p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{unreadNotifs}</p>
                                <p className="text-[9px] sm:text-[11px] text-slate-400 mt-1">Unread</p>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Upcoming Queues</h3>
                                    <p className="text-[10px] sm:text-xs text-slate-500">Manage active queues.</p>
                                </div>
                                <Link to="/student/my-tickets" className="text-[10px] sm:text-xs font-semibold text-blue-600 hover:underline">View All</Link>
                            </div>
                            <div className="p-2">
                                {activeTicket ? (
                                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{activeTicket.queueName}</p>
                                                <p className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[120px]">{activeTicket.officeName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-block px-2 py-0.5 sm:py-1 bg-emerald-50 text-emerald-600 text-[9px] sm:text-[10px] font-bold rounded-full mb-1">Open</span>
                                            <p className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">Pos: {activeTicket.position}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 sm:p-6 text-center text-xs sm:text-sm text-slate-500">No active queues right now.</div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                                    <p className="text-[10px] sm:text-xs text-slate-500">Latest updates.</p>
                                </div>
                                <Link to="/student/history" className="text-[10px] sm:text-xs font-semibold text-blue-600 hover:underline">View All</Link>
                            </div>
                            <div className="p-2">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3">
                                            <div className="mt-0.5 h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                    {item.status === 'COMPLETED' ? 'Completed' : 'Joined'} {item.queueName || 'Queue'}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-slate-500 truncate">{item.officeName || 'Office'}</p>
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap pt-1">
                                                {new Date(item.createdAt || item.joinedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 sm:p-6 text-center text-xs sm:text-sm text-slate-500">No recent activity found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-col items-center text-center shadow-sm">
                        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <User className="h-6 w-6 sm:h-8 sm:w-8" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-full">{user?.fullName}</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4">{user?.role} • {university?.code || 'LAUTECH'}</p>
                        <Link to="/student/profile" className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                            View Profile <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Live Queues</h3>
                            <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 sm:py-1 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                            </span>
                        </div>
                        <div className="p-2">
                            {topQueues.length > 0 ? topQueues.map(q => (
                                <div key={q.id} className="flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <div className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                                            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{q.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">{q.waitingCount || 0} / {q.capacity || 20}</p>
                                        <span className={`text-[9px] sm:text-[10px] font-bold ${q.isOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {q.isOpen ? 'Open' : 'Closed'}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-4 text-center text-xs text-slate-500">No queues active.</div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3">Useful Links</h3>
                        <ul className="space-y-2 sm:space-y-3">
                            {['LAUTECH Website', 'Academic Calendar', 'Student Handbook', 'IT Support'].map((link, i) => (
                                <li key={i}>
                                    <a href="#" className="flex items-center justify-between text-xs sm:text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                                        {link}
                                        <ArrowRight className="h-3 w-3" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}