import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import HolidayStrip from '../student/HolidayStrip'

function getGreeting() {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Lagos',
        hour: 'numeric',
        hour12: false
    })
    const hour = parseInt(formatter.format(new Date()), 10)

    if (hour >= 5 && hour < 12) return 'Good morning'
    if (hour >= 12 && hour < 17) return 'Good afternoon'
    if (hour >= 17 && hour < 21) return 'Good evening'
    return 'Good night'
}

export default function StudentHeader({ subtitle }) {
    const { user } = useAuthStore()
    const firstName = user?.fullName?.split(' ')[0] || 'there'

    const [greeting, setGreeting] = useState(getGreeting())
    const [closedDates, setClosedDates] = useState(null)

    useEffect(() => {
        const token = setInterval(() => setGreeting(getGreeting()), 60_000)
        return () => clearInterval(token)
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
        <div className="sticky top-16 z-30 mb-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:px-6 sm:py-4">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex w-fit items-center gap-2 rounded-full border border-brand-100 bg-brand-50/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-400">
                    <Sparkles className="h-3 w-3" />
                    Student Workspace
                </div>
                <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                    {greeting}, {firstName}
                </h1>
                {subtitle && (
                    <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                        {subtitle}
                    </p>
                )}
            </motion.div>

            {closedDates && (
                <HolidayStrip closedDates={closedDates} className="mt-2" />
            )}
        </div>
    )
}