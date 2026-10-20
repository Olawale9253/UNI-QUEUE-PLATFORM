import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import HolidayStrip from '../student/HolidayStrip'

function getGreeting() {
    const item = new Date().getHours()
    if (item >= 5 && item < 12) return 'Good morning'
    if (item >= 12 && item < 17) return 'Good afternoon'
    if (item >= 17 && item < 21) return 'Good evening'
    return 'Good night'
}

export default function PageHeader({ workspace = 'Workspace', description }) {
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
        <div className="mb-8">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex w-fit items-center gap-2 rounded-full border border-brand-100 bg-brand-50/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-400">
                    <Sparkles className="h-3 w-3" />
                    {workspace}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0f172a] dark:text-white sm:text-3xl">
                    {greeting}, {firstName}
                </h1>
                {description && (
                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                )}
            </motion.div>

            {closedDates && (
                <HolidayStrip closedDates={closedDates} className="mt-4" />
            )}
        </div>
    )
}