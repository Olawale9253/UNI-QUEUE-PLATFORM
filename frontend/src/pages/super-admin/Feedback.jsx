import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Star, Search, Filter } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../lib/format'

export default function Feedback() {
    const { push } = useToastStore()
    const [feedback, setFeedback] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

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

    const filtered = feedback.filter(f =>
        f.comment?.toLowerCase().includes(search.toLowerCase()) ||
        f.universityName?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 pb-12">
            <Card padded={false}>
                <div className="border-b border-slate-100 p-4 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Platform Feedback</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Review issues and ratings submitted by students.</p>
                    </div>
                    <div className="w-full max-w-xs">
                        <Input placeholder="Search by university or comment..." value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} />
                    </div>
                </div>

                {loading ? (
                    <div className="p-4 space-y-4">{[1, 2, 3].map(i => <SkeletonRow key={i} />)}</div>
                ) : filtered.length === 0 ? (
                    <EmptyState icon={MessageSquare} title="No feedback found" description="There is no feedback matching your search." />
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filtered.map((item) => (
                            <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                    {item.studentName?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'ST'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.studentName}</span>
                                        <Badge variant="default">{item.universityName}</Badge>
                                        <div className="flex items-center gap-0.5 ml-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star key={star} className={`h-3.5 w-3.5 ${star <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">"{item.comment}"</p>
                                    <div className="mt-2 text-xs text-slate-500">{formatDateTime(item.createdAt)}</div>
                                </div>
                                <div className="shrink-0">
                                    <Badge variant={item.resolved ? 'success' : 'warning'}>
                                        {item.resolved ? 'Resolved' : 'Pending'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
