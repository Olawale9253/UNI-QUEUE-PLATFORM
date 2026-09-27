import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Calendar, Clock, User, Mail, CheckCircle2, XCircle, Search, Filter,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem } from '../../lib/motion'

const STATUS_VARIANTS = {
    BOOKED: 'info',
    CONFIRMED: 'indigo',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    NO_SHOW: 'warning',
}

export default function AppointmentsList() {
    const { push } = useToastStore()
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('ALL')
    const [search, setSearch] = useState('')

    useEffect(() => {
        let cancelled = false
        api
            .get('/api/staff/appointments')
            .then((res) => { if (!cancelled) setAppointments(res.data?.data || []) })
            .catch((err) => {
                if (!cancelled) {
                    const msg = err.response?.data?.message || 'Failed to load appointments'
                    setError(msg)
                }
            })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [push])

    const filtered = appointments.filter((a) => {
        if (filter !== 'ALL' && a.status !== filter) return false
        if (search.trim()) {
            const s = search.toLowerCase()
            return (
                a.studentName?.toLowerCase().includes(s) ||
                a.studentEmail?.toLowerCase().includes(s) ||
                a.slotTitle?.toLowerCase().includes(s)
            )
        }
        return true
    })

    const tabs = ['ALL', 'BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

    if (loading) {
        return (
            <>
                <PageHeader title="Appointments" description="Appointments booked with you." />
                <Card padded={false}>
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                </Card>
            </>
        )
    }

    return (
        <>
            <PageHeader
                title="Appointments"
                description="Every appointment students have booked with you."
            />

            {error ? (
                <EmptyState
                    icon={Calendar}
                    title="Appointments aren't available yet"
                    description="This feature is being set up. Check back shortly."
                />
            ) : appointments.length === 0 ? (
                <EmptyState
                    icon={Calendar}
                    title="No appointments yet"
                    description="When students book slots you created, they'll appear here."
                />
            ) : (
                <>
                    {/* Filters */}
                    <div className="mb-5 space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                            {tabs.map((t) => {
                                const count = t === 'ALL' ? appointments.length : appointments.filter((a) => a.status === t).length
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFilter(t)}
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                            filter === t
                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                        }`}
                                    >
                                        {t.charAt(0) + t.slice(1).toLowerCase()}
                                        <span className="ml-1.5 opacity-60">{count}</span>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by student or slot"
                                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                            />
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <EmptyState
                            icon={Filter}
                            title="No appointments match"
                            description="Try a different filter or clear the search."
                            action={
                                <Button variant="secondary" onClick={() => { setFilter('ALL'); setSearch('') }}>
                                    Clear filters
                                </Button>
                            }
                        />
                    ) : (
                        <motion.div
                            variants={stagger(0, 0.03)}
                            initial="initial"
                            animate="animate"
                            className="space-y-3"
                        >
                            {filtered.map((a) => (
                                <motion.div key={a.id} variants={staggerItem}>
                                    <Card>
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                                                    {a.studentName?.slice(0, 1).toUpperCase() || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                            {a.studentName || 'Unknown student'}
                                                        </h3>
                                                        <Badge variant={STATUS_VARIANTS[a.status] || 'default'}>
                                                            {a.status}
                                                        </Badge>
                                                    </div>
                                                    {a.studentEmail && (
                                                        <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                            <Mail className="h-3 w-3 shrink-0" />
                                                            {a.studentEmail}
                                                        </div>
                                                    )}
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {a.slotTitle && (
                                                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                                                {a.slotTitle}
                              </span>
                                                        )}
                                                        {a.startTime && (
                                                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                                                {new Date(a.startTime).toLocaleString()}
                              </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </>
            )}
        </>
    )
}