import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Calendar, Building2, ShieldCheck } from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import HolidayStrip from '../student/HolidayStrip'

function getGreeting() {
    const item = new Date().getHours()
    if (item >= 5 && item < 12) return 'Good morning'
    if (item >= 12 && item < 17) return 'Good afternoon'
    if (item >= 17 && item < 21) return 'Good evening'
    return 'Good night'
}

function formatDate(now) {
    return now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

const ROLE_BADGES = {
    SUPER_ADMIN: 'Platform Super Admin',
    ADMIN: 'Campus Administrator',
    STAFF: 'Staff Officer',
    USER: 'Enrolled Student',
    FRESHER: 'Fresher Admission',
}

export default function PageHeader({ workspace, title, description, action }) {
    const { user } = useAuthStore()
    const { university } = useUniversityStore()
    const firstName = user?.fullName?.split(' ')[0] || 'there'
    const roleLabel = (user?.role && ROLE_BADGES[user.role]) || user?.role || 'User'
    const campusName = university?.name || university?.code

    const [now, setNow] = useState(new Date())
    const [closedDates, setClosedDates] = useState(null)

    // Tick every 60 seconds so greeting + date stay in sync with the clock
    useEffect(() => {
        const token = setInterval(() => setNow(new Date()), 60_000)
        return () => clearInterval(token)
    }, [])

    // Fetch closed dates on mount and refresh every 5 minutes
    useEffect(() => {
        let cancelled = false

        const fetchClosedDates = () => {
            api.get('/api/closed-dates')
                .then((res) => {
                    if (!cancelled) {
                        setClosedDates(res.data?.data || {
                            todayClosed: false,
                            todayReason: null,
                            upcoming: [],
                        })
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        setClosedDates({
                            todayClosed: false,
                            todayReason: null,
                            upcoming: [],
                        })
                    }
                })
        }

        fetchClosedDates()
        const interval = setInterval(fetchClosedDates, 5 * 60_000)

        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [])

    // If it's a subpage header with only a title, render clean layout header
    if (title && !workspace) {
        return (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {description}
                        </p>
                    )}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        )
    }

    const greeting = getGreeting()
    const activeWorkspace = workspace || 'Workspace'

    return (
        <div className="mb-6">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl shadow-slate-950/20 sm:p-7"
            >
                {/* Ambient glow effects */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-brand-500/15 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

                <div className="relative z-10 space-y-4">
                    {/* Top tags row */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <div className="flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-200 backdrop-blur-md">
                            <Sparkles className="h-3.5 w-3.5 text-brand-300" />
                            {activeWorkspace}
                        </div>

                        {campusName && (
                            <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200 backdrop-blur-md">
                                <Building2 className="h-3.5 w-3.5 text-indigo-300" />
                                {campusName}
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(now)}
                        </div>

                        <div className="ml-auto hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 sm:flex">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Workspace Active</span>
                        </div>
                    </div>

                    {/* Greeting & description */}
                    <div className="pt-1">
                        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            {greeting}, {firstName}
                        </h1>
                        {description && (
                            <p className="mt-1.5 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-300">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Bottom user badge strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs text-slate-300">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                                {roleLabel}
                            </span>
                            {user?.department && (
                                <span className="text-slate-400">
                                    Dept: <strong className="text-slate-200">{user.department}</strong>
                                </span>
                            )}
                            {user?.matricNumber && (
                                <span className="text-slate-400 font-mono">
                                    Matric: <strong className="text-slate-200">{user.matricNumber}</strong>
                                </span>
                            )}
                        </div>
                        {action && <div className="shrink-0">{action}</div>}
                    </div>
                </div>

                {closedDates && (
                    <HolidayStrip closedDates={closedDates} className="mt-4 relative z-10" />
                )}
            </motion.div>
        </div>
    )
}
