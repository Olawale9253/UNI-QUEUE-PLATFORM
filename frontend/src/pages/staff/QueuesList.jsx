import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Building2, MapPin, Clock, Users, ListOrdered, Search, Ticket, GraduationCap,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem } from '../../lib/motion'

export default function QueuesList() {
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        let cancelled = false
        api.get('/api/staff/queues')
            .then((res) => { if (!cancelled) setQueues(res.data?.data || []) })
            .catch((err) => { if (!cancelled) push({ type: 'error', message: err.response?.data?.message || 'Failed to load queues' }) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [push])

    const filtered = useMemo(() => {
        if (!search.trim()) return queues
        const s = search.toLowerCase()
        return queues.filter((q) => q.name?.toLowerCase().includes(s) || q.department?.toLowerCase().includes(s) || q.location?.toLowerCase().includes(s))
    }, [queues, search])

    if (loading) {
        return (
            <>
                <PageHeader title="Queues" description="Every queue at your university." />
                <SkeletonQueueGrid count={6} />
            </>
        )
    }

    return (
        <>
            <PageHeader title="All queues" description="Browse every queue across your university — live status, wait times, and staff." />

            {queues.length > 0 && (
                <div className="mb-5">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search queues"
                            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                    </div>
                </div>
            )}

            {queues.length === 0 ? (
                <EmptyState icon={ListOrdered} title="No queues" description="No queues have been created yet." />
            ) : filtered.length === 0 ? (
                <EmptyState icon={Search} title="No matches" description="Try a different search." action={<Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button>} />
            ) : (
                <motion.div variants={stagger(0, 0.04)} initial="initial" animate="animate" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((q) => (
                        <motion.div key={q.id} variants={staggerItem}>
                            <Card className="flex h-full flex-col">
                                <div className="mb-2 flex items-start justify-between gap-3">
                                    <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{q.name}</h3>
                                    <Badge variant={q.isActive ? 'success' : 'default'}>{q.isActive ? 'Active' : 'Inactive'}</Badge>
                                </div>

                                {q.department && (
                                    <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        <Building2 className="h-3 w-3" />{q.department}
                                    </p>
                                )}
                                {q.location && (
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        <MapPin className="h-3 w-3" />{q.location}
                                    </p>
                                )}

                                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                                    <div>
                                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                            <Users className="h-3 w-3" /> Waiting
                                        </div>
                                        <div className="mt-1 text-base font-bold text-brand-600 dark:text-brand-400">
                                            {q.waitingCount ?? 0}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                            <Clock className="h-3 w-3" /> ~Wait
                                        </div>
                                        <div className="mt-1 text-base font-bold text-amber-600 dark:text-amber-400">
                                            {q.estimatedMinutes ?? 0}<span className="text-xs font-normal text-slate-500">m</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                            <Ticket className="h-3 w-3" /> Staff
                                        </div>
                                        <div className="mt-1 text-base font-bold text-sky-600 dark:text-sky-400">
                                            {q.staffCount ?? 0}
                                        </div>
                                    </div>
                                </div>

                                {(q.staff?.length > 0 || q.matricRequired) && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {q.matricRequired && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        <GraduationCap className="h-3 w-3" />Matric
                      </span>
                                        )}
                                        {q.staff?.slice(0, 3).map((s) => (
                                            <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-600 text-[8px] font-bold text-white">
                          {s.fullName?.slice(0, 1).toUpperCase()}
                        </span>
                                                {s.fullName}
                      </span>
                                        ))}
                                        {(q.staff?.length ?? 0) > 3 && (
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">
                        +{(q.staff?.length ?? 0) - 3}
                      </span>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </>
    )
}