import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ListOrdered, Calendar, Building2, Activity, ArrowRight, Sparkles,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import StaffStatsCards from '../../components/staff/StaffStatsCards'
import { useAuthStore } from '../../store/authStore'

const QUICK_ACTIONS = [
    { to: '/staff/serving', label: 'Serving Queue', description: 'Call the next ticket and serve students.', icon: ListOrdered, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400' },
    { to: '/staff/queues', label: 'All Queues', description: 'Browse every queue and its staff.', icon: Building2, accent: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
    { to: '/staff/slots', label: 'Appointment Slots', description: 'Set your bookable time slots.', icon: Calendar, accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { to: '/staff/activity', label: 'Your Activity', description: 'See your service history and stats.', icon: Activity, accent: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
]

export default function StaffHome() {
    const { user } = useAuthStore()
    const firstName = user?.fullName?.split(' ')[0] || 'there'

    return (
        <>
            {/* ─── Sticky greeting header ─── */}
            <div className="sticky top-16 z-30 -mx-3 -mt-4 mb-6 border-b border-slate-200 bg-white/95 px-3 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:-mx-5 sm:-mt-6 sm:px-5 sm:py-5 lg:-mx-8 lg:-mt-8 lg:px-8 lg:py-6">
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        Staff Workspace
                    </div>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                        Good to see you, {firstName}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Here's a snapshot of your day at the office.
                    </p>
                </motion.div>
            </div>

            <StaffStatsCards />

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-2">
                <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Quick actions</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {QUICK_ACTIONS.map((a, i) => {
                        const Icon = a.icon
                        return (
                            <motion.div
                                key={a.to}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + i * 0.05 }}
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