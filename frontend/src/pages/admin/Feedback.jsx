import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare, Search, Filter } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import ExportButton from '../../components/ui/ExportButton'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../lib/format'
import { stagger, staggerItem } from '../../lib/motion'

const RATING_FILTERS = [
    { value: '', label: 'All ratings' },
    { value: '5', label: '5 stars' },
    { value: '4', label: '4 stars' },
    { value: '3', label: '3 stars' },
    { value: '2', label: '2 stars' },
    { value: '1', label: '1 star' },
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
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load feedback' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    const filtered = feedback.filter((f) => {
        if (ratingFilter && String(f.rating) !== ratingFilter) return false
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
            f.ticketNumber?.toLowerCase().includes(q) ||
            f.userFullName?.toLowerCase().includes(q) ||
            f.comment?.toLowerCase().includes(q)
        )
    })

    // Compute average
    const avgRating =
        feedback.length > 0
            ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length).toFixed(1)
            : '—'

    // Rating distribution
    const distribution = [5, 4, 3, 2, 1].map((r) => ({
        rating: r,
        count: feedback.filter((f) => f.rating === r).length,
    }))
    const maxCount = Math.max(1, ...distribution.map((d) => d.count))

    return (
        <>
            <PageHeader
                title="Student Feedback"
                description="What students say about your service."
                action={
                    <ExportButton
                        rows={feedback}
                        columns={[
                            { key: 'ticketNumber', label: 'Ticket' },
                            { key: 'userFullName', label: 'Student' },
                            { key: 'rating', label: 'Rating' },
                            { key: 'comment', label: 'Comment' },
                            { key: 'createdAt', label: 'Submitted' },
                        ]}
                        filename="uniqueue-feedback"
                        label="Export feedback"
                    />
                }
            />

            {/* Summary cards */}
            {feedback.length > 0 && (
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Average rating */}
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-50">
                                <span className="text-2xl font-semibold text-amber-700">{avgRating}</span>
                            </div>
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Average rating
                                </div>
                                <div className="mt-1 flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <Star
                                            key={n}
                                            className={`h-4 w-4 ${
                                                n <= Math.round(parseFloat(avgRating))
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-slate-300'
                                            }`}
                                        />
                                    ))}
                                    <span className="ml-2 text-sm text-slate-600">
                    from {feedback.length} {feedback.length === 1 ? 'review' : 'reviews'}
                  </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Distribution */}
                    <Card>
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
                            Rating distribution
                        </div>
                        <div className="space-y-1.5">
                            {distribution.map((d) => (
                                <div key={d.rating} className="flex items-center gap-2 text-xs">
                                    <span className="w-3 text-slate-600">{d.rating}</span>
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(d.count / maxCount) * 100}%` }}
                                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                            className="h-full rounded-full bg-amber-400"
                                        />
                                    </div>
                                    <span className="w-6 text-right text-slate-600">{d.count}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Filters */}
            {feedback.length > 0 && (
                <div className="mb-4 space-y-3">
                    <Input
                        placeholder="Search by ticket, student, or comment…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={Search}
                    />

                    <div className="flex flex-wrap gap-1.5">
                        {RATING_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setRatingFilter(f.value)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                    ratingFilter === f.value
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <Card padded={false}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonRow key={i} />
                    ))}
                </Card>
            ) : feedback.length === 0 ? (
                <EmptyState
                    icon={MessageSquare}
                    title="No feedback yet"
                    description="Students haven't rated any services yet. Feedback will appear here once they do."
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Filter}
                    title="No feedback matches your filters"
                    description="Try adjusting your search or rating filter."
                />
            ) : (
                <Card padded={false}>
                    <motion.ul
                        variants={stagger(0, 0.03)}
                        initial="initial"
                        animate="animate"
                        className="divide-y divide-slate-100"
                    >
                        {filtered.map((f) => (
                            <motion.li
                                key={f.id}
                                variants={staggerItem}
                                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-6"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                    {f.userFullName?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {f.userFullName}
                    </span>
                                        <Badge variant="default">
                                            Ticket {f.ticketNumber}
                                        </Badge>
                                    </div>

                                    <div className="mt-1 flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <Star
                                                key={n}
                                                className={`h-4 w-4 ${
                                                    n <= f.rating
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'text-slate-300'
                                                }`}
                                            />
                                        ))}
                                        <span className="ml-2 text-xs text-slate-500">
                      {formatDateTime(f.createdAt)}
                    </span>
                                    </div>

                                    {f.comment && (
                                        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                            {f.comment}
                                        </p>
                                    )}
                                </div>
                            </motion.li>
                        ))}
                    </motion.ul>
                </Card>
            )}
        </>
    )
}