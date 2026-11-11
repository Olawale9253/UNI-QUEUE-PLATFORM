import { useEffect, useState } from 'react'
import { Sparkles, Calendar } from 'lucide-react'
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
        // Sticky container with a solid background to prevent scrolling glitches
        <div className="sticky top-0 z-30 -mx-4 border-b border-slate-200 bg-white px-4 pt-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col">
                {/* Row 1: Badges, Campus Name, and Date */}
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        {activeWorkspace}
                    </span>

                    {campusName && (
                        // Changed to brand color
                        <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                            • {campusName}
                        </span>
                    )}

                    <span className="flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(now)}
                    </span>
                </div>

                {/* Row 2: Greeting with Primary Color Name */}
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    {greeting}, <span className="text-brand-600 dark:text-brand-400">{firstName}</span>
                </h1>

                {/* Row 3: Description */}
                {description && (
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                )}

                {/* Row 4: Holiday Strip */}
                {closedDates && (
                    <div className="mt-3">
                        <HolidayStrip closedDates={closedDates} />
                    </div>
                )}
            </div>
        </div>
    )
}