import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare, Search, Filter, ThumbsUp, ThumbsDown, User, Clock } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../lib/format'

const RATING_FILTERS = [
    { value: '', label: 'All Ratings' },
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
    const [ratingFilter, setRatingFilter] = useState('')

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/admin/feedback')
            setFeedback(res.data.data || [])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load feedback' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    const filtered = useMemo(() => {
        let list = feedback
        if (ratingFilter) list = list.filter((item) => String(item.rating) === ratingFilter)
        if (search.trim()) {
            const searchValue = search.toLowerCase()
            list = list.filter(
                (item) =>
                    item.ticketNumber?.toLowerCase().includes(searchValue) ||
                    item.userFullName?.toLowerCase().includes(searchValue) ||
                    item.comment?.toLowerCase().includes(searchValue)
            )
        }
        return list
    }, [feedback, ratingFilter, search])

    const totalReviews = feedback.length
    const avgRating = totalReviews > 0
        ? (feedback.reduce((sum, itemValue) => sum + (itemValue.rating || 0), 0) / totalReviews).toFixed(1)
        : '0.0'
    const positiveReviews = feedback.filter(f => f.rating >= 4).length

    const STATS = [
        { label: 'Average Rating', value: avgRating, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
        { label: 'Total Reviews', value: totalReviews, icon: MessageSquare, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950/40' },
        { label: 'Positive Reviews', value: positiveReviews, icon: ThumbsUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    ]

    if (loading) {
        return (
            <div className="space-y-6 pb-12 px-4 sm:px-6">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 sm:h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}
                </div>
                <Card padded={false}>{[1, 2, 3].map(i => <SkeletonRow key={i} />)}</Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-12 px-4 sm:px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Student Feedback</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monitor student experiences and resolve issues.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {STATS.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-5 gap-2">
                            <div>
                                <p className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">{stat.label}</p>
                                <p className="mt-1 sm:mt-2 text-lg sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{stat.value}</p>
                            </div>
                            <div className={`flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {feedback.length > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full sm:max-w-sm">
                        <Input
                            placeholder="Search by ticket, student, or comment..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={Search}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 sm:pb-0 scrollbar-hide">
                        <Filter className="mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {RATING_FILTERS.map((item) => (
                            <button
                                key={item.value}
                                onClick={() => setRatingFilter(item.value)}
                                className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] sm:text-xs font-semibold transition-colors ${
                                    ratingFilter === item.value
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {feedback.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No feedback yet" description="Students haven't rated any services yet." />
            ) : filtered.length === 0 ? (
                <EmptyState icon={Filter} title="No feedback matches" description="Try adjusting your search or rating filter." />
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {filtered.map((itemValue) => (
                        <motion.div key={itemValue.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="p-4 sm:p-5">
                                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex gap-3 sm:gap-4">
                                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs sm:text-sm font-bold text-white dark:bg-slate-700">
                                            {itemValue.userFullName?.charAt(0) || <User className="h-4 w-4 sm:h-5 sm:w-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                                    {itemValue.userFullName || 'Anonymous Student'}
                                                </h3>
                                                <Badge variant="default" className="flex items-center gap-1 text-[9px] sm:text-xs">
                                                    Ticket {itemValue.ticketNumber}
                                                </Badge>
                                            </div>
                                            <div className="mt-1 flex items-center gap-0.5 sm:gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${star <= itemValue.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                                ))}
                                                <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">{itemValue.rating}.0</span>
                                            </div>
                                            <div className="mt-2 sm:mt-3 rounded-xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-800/50">
                                                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                                    "{itemValue.comment || 'No written comment provided.'}"
                                                </p>
                                            </div>
                                            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {formatDateTime(itemValue.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 sm:pt-1 self-end sm:self-start">
                                        {itemValue.rating <= 2 ? (
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