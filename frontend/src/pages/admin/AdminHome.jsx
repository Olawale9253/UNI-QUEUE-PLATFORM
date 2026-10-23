import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    LayoutGrid, ListOrdered, Users, Building2, BarChart3,
    ArrowRight, CalendarCheck,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import AdminStatsCards from '../../components/admin/AdminStatsCards'

const QUICK_ACTIONS = [
    { to: '/admin/overview', label: 'Overview', description: 'See your services and staff at a glance.', icon: LayoutGrid, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400' },
    { to: '/admin/queues', label: 'Services', description: 'Create, edit, and manage every service.', icon: ListOrdered, accent: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
    { to: '/admin/appointments', label: 'Appointments', description: 'Review every booked appointment.', icon: CalendarCheck, accent: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
    { to: '/admin/staff', label: 'Staff', description: 'Add staff and assign them to services.', icon: Users, accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { to: '/admin/offices', label: 'Offices', description: 'See how services roll up into offices.', icon: Building2, accent: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
    { to: '/admin/analytics', label: 'Analytics', description: 'Track wait times and staff performance.', icon: BarChart3, accent: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
]

export default function AdminHome() {
    return (
        // Changed spacing to make it tighter since the header is gone
        <div className="space-y-6 pb-12 mt-2">

            {/* 🔧 Removed the redundant header block here */}

            <AdminStatsCards />

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                    <Card className="flex h-full items-start gap-4 transition-all duration-200 hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.accent} transition-transform group-hover:scale-105`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                                                    {item.label}
                                                </h3>
                                                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
                                            </div>
                                            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                                {item.description}
                                            </p>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>
            </motion.div>
        </div>
    )
}