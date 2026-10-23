import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Calendar, CalendarCheck, Clock, User, Mail, Search, Filter,
    CheckCircle2, XCircle,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { stagger, staggerItem } from '../../lib/motion'

const STATUS_VARIANTS = {
    BOOKED: 'info',
    CONFIRMED: 'indigo',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    NO_SHOW: 'warning',
}

const FILTERS = ['ALL', 'BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

function StatTile({ label, value, hint, icon: Icon, accent, valueColor }) {
    return (
        <Card className="flex flex-col justify-between h-full">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
                    <div className={`mt-2 truncate text-3xl font-bold tracking-tight ${valueColor}`}>{value}</div>
                    {hint && <div className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{hint}</div>}
                </div>
                {Icon && (
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>
        </Card>
    )
}

export default function Appointments() {
    const { push } = useToastStore()
    const [appointments, setAppointments] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')
    const [search, setSearch] = useState('')

    const load = useCallback(async () => {
        try {
            const [firstValue, stringValue] = await Promise.all([
                api.get('/api/admin/appointments'),
                api.get('/api/admin/appointments/stats').catch(() => ({ data: { data: null } })),
            ])
            setAppointments(firstValue.data?.data || [])
            setStats(stringValue.data?.data || null)
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load appointments' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    const filtered = useMemo(() => {
        let list = appointments
        if (filter !== 'ALL') list = list.filter((item) => item.status === filter)
        if (search.trim()) {
            const searchValue = search.toLowerCase()
            list = list.filter((item) =>
                item.studentName?.toLowerCase().includes(searchValue) ||
                item.studentEmail?.toLowerCase().includes(searchValue) ||
                item.staffName?.toLowerCase().includes(searchValue) ||
                item.slotTitle?.toLowerCase().includes(searchValue)
            )
        }
        return list
    }, [appointments, filter, search])

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <Card padded={false}>
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Appointments</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage and track all scheduled bookings across your university.</p>
            </div>

            {stats && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <StatTile label="Total" value={stats.total ?? 0} hint="All time" icon={Calendar} accent="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" valueColor="text-slate-900 dark:text-slate-100" />
                    <StatTile label="Today" value={stats.today ?? 0} hint="Booked for today" icon={CalendarCheck} accent="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400" valueColor="text-brand-600 dark:text-brand-400" />
                    <StatTile label="Upcoming" value={stats.upcoming ?? 0} hint="Scheduled ahead" icon={Clock} accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400" valueColor="text-sky-600 dark:text-sky-400" />
                    <StatTile label="Completed" value={stats.completed ?? 0} hint="All time" icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" valueColor="text-emerald-600 dark:text-emerald-400" />
                    <StatTile label="Cancelled" value={stats.cancelled ?? 0} hint="All time" icon={XCircle} accent="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" valueColor="text-rose-600 dark:text-rose-400" />
                </motion.div>
            )}

            {appointments.length > 0 && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full max-w-sm">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by student, staff, or slot..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Filter className="mr-1 h-3.5 w-3.5 text-slate-400" />
                        {FILTERS.map((item) => {
                            const count = item === 'ALL' ? appointments.length : appointments.filter((a) => a.status === item).length
                            return (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setFilter(item)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        filter === item
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {item.charAt(0) + item.slice(1).toLowerCase().replace(/_/g, ' ')}
                                    <span className="ml-1.5 opacity-60">{count}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {appointments.length === 0 ? (
                <EmptyState icon={Calendar} title="No appointments yet" description="When students book slots with your staff, they'll appear here." />
            ) : filtered.length === 0 ? (
                <EmptyState icon={Filter} title="No appointments match" description="Try a different filter or clear the search." action={<Button variant="secondary" onClick={() => { setFilter('ALL'); setSearch('') }}>Clear filters</Button>} />
            ) : (
                <motion.div variants={stagger(0, 0.03)} initial="initial" animate="animate" className="space-y-4">
                    {filtered.map((itemValue) => (
                        <motion.div key={itemValue.id} variants={staggerItem}>
                            <Card className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white dark:bg-brand-700">
                                            {itemValue.studentName?.slice(0, 1).toUpperCase() || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{itemValue.studentName || 'Unknown student'}</h3>
                                                <Badge variant={STATUS_VARIANTS[itemValue.status] || 'default'}>{itemValue.status}</Badge>
                                            </div>
                                            {itemValue.studentEmail && (
                                                <div className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500 dark:text-slate-400">
                                                    <Mail className="h-3.5 w-3.5 shrink-0" />{itemValue.studentEmail}
                                                </div>
                                            )}
                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                {itemValue.slotTitle && (
                                                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{itemValue.slotTitle}</span>
                                                )}
                                                {itemValue.startTime && (
                                                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{new Date(itemValue.startTime).toLocaleString()}</span>
                                                )}
                                                {itemValue.staffName && (
                                                    <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{itemValue.staffName}</span>
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
        </div>
    )
}