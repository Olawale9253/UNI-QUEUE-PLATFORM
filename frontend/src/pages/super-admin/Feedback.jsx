import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    MessageSquare, Star, Search, Filter,
    Building2, User, ThumbsUp, ThumbsDown, CheckCircle2, Clock
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../lib/format'

const RATING_FILTERS = [
    { value: 'ALL', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' },
]

export default function Feedback() {
    const { push } = useToastStore()
    const [feedback, setFeedback] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [ratingFilter, setRatingFilter] = useState('ALL')

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/api/super-admin/feedback')
                setFeedback(res.data?.data || [])
            } catch (err) {
                push({ type: 'error', message: 'Failed to load feedback' })
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [push])

    const totalReviews = feedback.length
    const avgRating = totalReviews > 0
        ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / totalReviews).toFixed(1)
        : '0.0'
    const positiveReviews = feedback.filter(f => f.rating >= 4).length

    const filtered = useMemo(() => {
        let list = feedback
        if (ratingFilter !== 'ALL') {
            list = list.filter(f => String(f.rating) === ratingFilter)
        }
        if (search.trim()) {
            const s = search.toLowerCase()
            list = list.filter(f =>
                f.comment?.toLowerCase().includes(s) ||
                f.studentName?.toLowerCase().includes(s) ||
                f.universityName?.toLowerCase().includes(s) ||
                f.queueName?.toLowerCase().includes(s)
            )
        }
        return list
    }, [feedback, ratingFilter, search])

    const STATS = [
        { label: 'Average Rating', value: avgRating, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
        { label: 'Total Reviews', value: totalReviews, icon: MessageSquare, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950/40' },
        { label: 'Positive Reviews', value: positiveReviews, icon: ThumbsUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    ]

    return (
        <div className="space-y-6 pb-12 px-4 sm:px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Student Feedback
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Monitor student experiences and resolve issues across all universities.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
                {STATS.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-2 sm:gap-0">
                            <div>
                                <p className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                                <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{stat.value}</p>
                            </div>
                            <div className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="w-full lg:max-w-sm">
                    <Input placeholder="Search by student, university, or keyword..." value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 lg:pb-0 scrollbar-hide">
                    <Filter className="mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {RATING_FILTERS.map((f) => (
                        <button key={f.value} onClick={() => setRatingFilter(f.value)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] sm:text-xs font-semibold transition-colors ${ratingFilter === f.value ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3 sm:space-y-4">
                    {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No feedback found" description={search ? "No feedback matches your search." : "There is no feedback yet."} />
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {filtered.map((item) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="p-4 sm:p-5">
                                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex gap-3 sm:gap-4">
                                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs sm:text-sm font-bold text-white dark:bg-slate-700">
                                            {item.studentName?.charAt(0) || <User className="h-4 w-4 sm:h-5 sm:w-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                                    {item.studentName || 'Anonymous Student'}
                                                </h3>
                                                <Badge variant="default" className="flex items-center gap-1 text-[9px] sm:text-xs">
                                                    <Building2 className="h-3 w-3" />
                                                    {item.universityName || item.universityCode || 'Unknown University'}
                                                </Badge>
                                            </div>

                                            <div className="mt-1 flex items-center gap-0.5 sm:gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${star <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                                ))}
                                                <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">{item.rating}.0</span>
                                            </div>

                                            <div className="mt-2 sm:mt-3 rounded-xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-800/50">
                                                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                                    "{item.comment || 'No written comment provided.'}"
                                                </p>
                                            </div>

                                            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(item.createdAt)}</span>
                                                {item.queueName && <span className="flex items-center gap-1 font-medium text-brand-600 dark:text-brand-400">Regarding: {item.queueName}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 sm:pt-1 self-end sm:self-start">
                                        {item.rating <= 2 ? (
                                            <Badge variant="danger" className="flex items-center gap-1 text-[9px] sm:text-xs"><ThumbsDown className="h-3 w-3" /> Needs Attention</Badge>
                                        ) : (
                                            <Badge variant="success" className="flex items-center gap-1 text-[9px] sm:text-xs"><ThumbsUp className="h-3 w-3" /> Positive</Badge>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}