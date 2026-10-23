import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Building2, Users, Activity, Clock,
    ArrowRight, Server, ShieldCheck, Megaphone, Ticket
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import { SkeletonStats, SkeletonCard } from '../../components/ui/Skeleton'

export default function SuperAdminHome() {
    const [stats, setStats] = useState({
        universities: 0,
        pending: 0,
        users: 0,
        activeTickets: 0
    })
    const [topUniversities, setTopUniversities] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [analyticsRes, uniRes, appsRes, usersRes] = await Promise.all([
                    api.get('/api/super-admin/analytics').catch(() => null),
                    api.get('/api/super-admin/universities').catch(() => ({ data: { data: [] } })),
                    api.get('/api/super-admin/university-applications?status=PENDING').catch(() => ({ data: { data: { totalElements: 0 } } })),
                    api.get('/api/super-admin/users?size=1').catch(() => ({ data: { data: { totalElements: 0 } } })),
                ])

                const unis = uniRes.data.data || []
                const pending = appsRes.data.data.totalElements || 0
                const users = usersRes.data.data.totalElements || 0
                let activeTickets = 0
                let topUnis = []

                if (analyticsRes && analyticsRes.data.data) {
                    const a = analyticsRes.data.data
                    activeTickets = a.waitingNow || 0
                    topUnis = [...(a.universities || [])]
                        .sort((x, y) => (y.ticketsAllTime || 0) - (x.ticketsAllTime || 0))
                        .slice(0, 5)
                }

                setStats({
                    universities: unis.length,
                    pending: pending,
                    users: users,
                    activeTickets: activeTickets
                })
                setTopUniversities(topUnis)
            } catch (err) {
                console.error("Failed to load dashboard data", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const STAT_CARDS = [
        { label: 'Total Universities', value: stats.universities, icon: Building2, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950/40', link: '/super-admin/universities' },
        { label: 'Pending Requests', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40', link: '/super-admin/pending-requests' },
        { label: 'Total Users', value: stats.users, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/40', link: '/super-admin/users' },
        { label: 'Active Tickets', value: stats.activeTickets, icon: Ticket, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40', link: '/super-admin/analytics' },
    ]

    const QUICK_ACTIONS = [
        { title: 'Review Requests', description: 'Approve or reject new university applications.', icon: ShieldCheck, link: '/super-admin/pending-requests', cta: 'Review Now' },
        { title: 'Manage Universities', description: 'View all active institutions and edit their details.', icon: Building2, link: '/super-admin/universities', cta: 'View List' },
        { title: 'Platform Analytics', description: 'Monitor ticket volume, growth, and performance.', icon: Activity, link: '/super-admin/analytics', cta: 'View Reports' },
        { title: 'Send Broadcast', description: 'Send announcements to all users across the platform.', icon: Megaphone, link: '/super-admin/broadcast', cta: 'Compose' },
    ]

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <SkeletonStats count={4} />
                <SkeletonCard />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Stats Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STAT_CARDS.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="flex flex-col justify-between h-full">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{stat.value}</p>
                                </div>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Link to={stat.link} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                                    View details <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Main Content (Quick Actions & Leaderboard) */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {QUICK_ACTIONS.map((action, i) => (
                                <Link key={i} to={action.link} className="group block h-full">
                                    <Card className="flex h-full flex-col transition-all duration-200 hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700">
                                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-brand-950/40 dark:group-hover:text-brand-400">
                                            <action.icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                            {action.title}
                                        </h3>
                                        <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">
                                            {action.description}
                                        </p>
                                        <div className="mt-4 flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400">
                                            {action.cta}
                                            <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Top Universities */}
                    <div>
                        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Most Active Universities</h2>
                        {topUniversities.length === 0 ? (
                            <Card>
                                <p className="text-sm text-slate-500 text-center py-6">No activity data yet.</p>
                            </Card>
                        ) : (
                            <Card padded={false}>
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {topUniversities.map((uni, idx) => (
                                        <li key={uni.universityId} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{uni.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{uni.code}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{uni.ticketsAllTime?.toLocaleString()}</p>
                                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Total Tickets</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Sidebar (System Status) */}
                <div className="space-y-6">
                    <div>
                        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">System Status</h2>
                        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white dark:from-slate-900 dark:to-slate-950 border-none shadow-lg">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                                    <Server className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">Operational</h3>
                                    <p className="text-xs text-slate-300">All systems running normally</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                                    <span className="text-xs font-medium text-slate-300">Database</span>
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Healthy
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                                    <span className="text-xs font-medium text-slate-300">API Server</span>
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Online
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                                    <span className="text-xs font-medium text-slate-300">Email Service</span>
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-white/10 pt-4 flex justify-between text-xs text-slate-400">
                                <span>Environment</span>
                                <span className="font-mono text-emerald-400">Production</span>
                            </div>
                        </Card>
                    </div>

                    <Card className="bg-brand-50 border-brand-200 dark:bg-brand-950/20 dark:border-brand-900/50">
                        <h3 className="text-sm font-bold text-brand-900 dark:text-brand-100">Welcome to the Console</h3>
                        <p className="mt-2 text-xs leading-relaxed text-brand-800 dark:text-brand-300">
                            This is your central hub for managing the entire UniQueue multi-tenant ecosystem.
                            Use the quick actions to navigate to specific management tools.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    )
}