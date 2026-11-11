import { useEffect, useState } from 'react'
import { Sparkles, Calendar, Building2 } from 'lucide-react'
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

export default function PageHeader({ workspace, title, description, action }) {
    const { user } = useAuthStore()
    const { university } = useUniversityStore()
    const firstName = user?.fullName?.split(' ')[0] || 'there'
    const campusName = university?.name || university?.code

    const [now, setNow] = useState(new Date())
    const [closedDates, setClosedDates] = useState(null)

    useEffect(() => {
        const token = setInterval(() => setNow(new Date()), 60_000)
        return () => clearInterval(token)
    }, [])

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
        <div className="sticky top-0 z-30 -mx-4 -mt-4 mb-6 bg-white/95 px-4 pt-6 pb-2 backdrop-blur-md sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8 dark:bg-slate-950/95">
            {/* Changed from motion.div to standard div to fix sticky transform bug */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 border-l-4 border-l-brand-500 bg-white shadow-sm dark:border-slate-800 dark:border-l-brand-500 dark:bg-slate-900">
                <div className="relative z-10 p-5 sm:p-6">
                    <div className="space-y-3">
                        {/* Top tags row */}
                        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                            <div className="flex w-fit items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                {activeWorkspace}
                            </div>

                            {campusName && (
                                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                    {campusName}
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(now)}
                            </div>
                        </div>

                        {/* Greeting & description */}
                        <div className="pt-1">
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
                                {greeting}, <span className="text-brand-600 dark:text-brand-400">{firstName}</span>
                            </h1>
                            {description && (
                                <p className="mt-1.5 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Holiday Strip */}
                        {closedDates && (
                            <div className="pt-2">
                                <HolidayStrip closedDates={closedDates} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}