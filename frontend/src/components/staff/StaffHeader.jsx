import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import HolidayStrip from '../student/HolidayStrip'

function getGreeting() {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'Good morning'
    if (h >= 12 && h < 17) return 'Good afternoon'
    if (h >= 17 && h < 21) return 'Good evening'
    return 'Good night'
}

/**
 * Sticky header shown on every staff page.
 *
 * Renders the shared HolidayStrip so staff always see today's holiday
 * status and upcoming closures, no matter which tab they're on.
 */
export default function StaffHeader({ subtitle }) {
    const { user } = useAuthStore()
    const firstName = user?.fullName?.split(' ')[0] || 'there'

    const [greeting, setGreeting] = useState(getGreeting())
    const [closedDates, setClosedDates] = useState(null)

    useEffect(() => {
        const t = setInterval(() => setGreeting(getGreeting()), 60_000)
        return () => clearInterval(t)
    }, [])

    useEffect(() => {
        let cancelled = false
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
        return () => { cancelled = true }
    }, [])

    return (
        <div className="sticky top-16 z-30 -mx-3 -mt-4 mb-5 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:-mx-5 sm:-mt-6 sm:px-5 sm:py-3.5 lg:-mx-8 lg:-mt-8 lg:px-8 lg:py-4">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                    <Sparkles className="h-3 w-3" />
                    Staff Workspace
                </div>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                    {greeting}, {firstName}
                </h1>
                {subtitle && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {subtitle}
                    </p>
                )}
            </motion.div>

            {closedDates && (
                <HolidayStrip closedDates={closedDates} className="mt-3" />
            )}
        </div>
    )
}