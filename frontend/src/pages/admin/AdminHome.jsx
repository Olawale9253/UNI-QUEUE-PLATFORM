import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    LayoutGrid, ListOrdered, Users, Building2, BarChart3, ArrowRight, Sparkles,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import AdminStatsCards from '../../components/admin/AdminStatsCards'
import { useAuthStore } from '../../store/authStore'

const QUICK_ACTIONS = [
    { to: '/admin/overview', label: 'Overview', description: 'See your queues and staff at a glance.', icon: LayoutGrid, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400' },
    { to: '/admin/queues', label: 'Queues', description: 'Create, edit, and manage every queue.', icon: ListOrdered, accent: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
    { to: '/admin/staff', label: 'Staff', description: 'Add staff, assign them to queues, and manage accounts.', icon: Users, accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { to: '/admin/offices', label: 'Offices', description: 'See how queues roll up into offices across the university.', icon: Building2, accent: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
    { to: '/admin/analytics', label: 'Analytics', description: 'Track wait times, service quality, and staff performance.', icon: BarChart3, accent: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
]

export default function AdminHome() {
    const { user } = useAuthStore()
    const firstName = user?.fullName?.split(' ')[0] || 'there'

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    Admin Workspace
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                    Welcome back, {firstName}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Here's what's happening across your university today.
                </p>
            </motion.div>

            <AdminStatsCards />

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-2">
                <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Quick actions</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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