import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, CalendarCheck, Clock, User, Mail, CheckCircle2, XCircle,
    Search, Filter, Hash, AlertCircle, ChevronRight,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import CopyButton from '../../components/ui/CopyButton'
import AppointmentDetailModal from '../../components/staff/AppointmentDetailModal'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

const STATUS_VARIANTS = {
    BOOKED: 'indigo',
    CONFIRMED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'default',
    NO_SHOW: 'danger',
}

const STATUS_LABELS = {
    BOOKED: 'Booked',
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No-show',
}

const TABS = [
    { value: 'TODAY', label: 'Today' },
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'PAST', label: 'Past' },
    { value: 'ALL', label: 'All' },
]

function formatDateTime(dt) {
    if (!dt) return '—'
    try {
        return new Date(dt).toLocaleString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
    } catch {
        return '—'
    }
}

function generateReference(appt) {
    if (!appt) return '—'
    const dateValue = appt.bookedAt ? new Date(appt.bookedAt) : new Date()
    const yyyy = dateValue.getFullYear()
    const mm = String(dateValue.getMonth() + 1).padStart(2, '0')
    const dd = String(dateValue.getDate()).padStart(2, '0')
    const idPart = String(appt.id || 0).padStart(4, '0')
    return `APP${yyyy}${mm}${dd}${idPart}`
}

export default function AppointmentsList() {
    const { push } = useToastStore()
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('TODAY')
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState(null)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/staff/appointments')
            setAppointments(res.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load appointments' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    const categorized = useMemo(() => {
        const now = new Date()
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

        const today = [], upcoming = [], past = []

        for (const a of appointments) {
            const start = a.startTime ? new Date(a.startTime) : null
            if (!start) continue
            if (start >= todayStart && start <= todayEnd) today.push(a)
            else if (start > todayEnd) upcoming.push(a)
            else past.push(a)
        }

        today.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        upcoming.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        past.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))

        return { today, upcoming, past, all: appointments }
    }, [appointments])

    const currentList = useMemo(() => {
        let list = categorized[tab.toLowerCase()] || []
        if (search.trim()) {
            const s = search.trim().toLowerCase()
            list = list.filter(
                (item) =>
                    item.studentName?.toLowerCase().includes(s) ||
                    item.studentEmail?.toLowerCase().includes(s) ||
                    item.slotTitle?.toLowerCase().includes(s) ||
                    item.matricNumber?.toLowerCase().includes(s) ||
                    generateReference(item).toLowerCase().includes(s)
            )
        }
        return list
    }, [categorized, tab, search])

    const tabCounts = useMemo(() => ({
        TODAY: categorized.today.length,
        UPCOMING: categorized.upcoming.length,
        PAST: categorized.past.length,
        ALL: categorized.all.length,
    }), [categorized])

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <Card padded={false}>
                    {Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)}
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Appointments
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage bookings students made with you. Click to mark complete or no-show.
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                    {TABS.map((item) => {
                        const isActive = tab === item.value
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setTab(item.value)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    isActive
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                }`}
                            >
                                {item.label}
                                <span className={`text-[10px] font-bold ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                                    {tabCounts[item.value] ?? 0}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {appointments.length > 0 && (
                    <div className="w-full max-w-sm">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search appointments..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Body */}
            {appointments.length === 0 ? (
                <EmptyState icon={Calendar} title="No appointments yet" description="When students book slots you created, they'll appear here." />
            ) : currentList.length === 0 ? (
                <EmptyState
                    icon={Filter}
                    title={search.trim() ? 'No matches' : `No ${tab.toLowerCase()} appointments`}
                    description={search.trim() ? 'Try a different search term.' : `Nothing on the "${tab.toLowerCase()}" tab. Try another tab.`}
                    action={search.trim() ? <Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button> : null}
                />
            ) : (
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={{ initial: {}, animate: { transition: { staggerChildren: 0.03 } } }}
                    className="space-y-4"
                >
                    {currentList.map((itemValue) => {
                        const isActionable = itemValue.status === 'BOOKED' || itemValue.status === 'CONFIRMED'
                        const isCompleted = itemValue.status === 'COMPLETED'
                        const isNoShow = itemValue.status === 'NO_SHOW'
                        const reference = generateReference(itemValue)

                        return (
                            <motion.div
                                key={itemValue.id}
                                variants={{ initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelected(itemValue)}
                                    className="group block w-full text-left"
                                >
                                    <Card className={`transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 ${isActionable ? 'border-brand-200 dark:border-brand-900' : ''}`}>
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 flex-1 items-start gap-4">
                                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                                                    isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                        : isNoShow ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                                            : 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                                                }`}>
                                                    {itemValue.studentName?.slice(0, 1).toUpperCase() || '?'}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                                                            {itemValue.studentName || 'Unknown student'}
                                                        </h3>
                                                        <Badge variant={STATUS_VARIANTS[itemValue.status] || 'default'}>
                                                            {STATUS_LABELS[itemValue.status] || itemValue.status}
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {itemValue.studentEmail && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate">{itemValue.studentEmail}</span>
                                                            </span>
                                                        )}
                                                        {itemValue.matricNumber && (
                                                            <span className="flex items-center gap-1 font-mono font-medium">
                                                                <Hash className="h-3.5 w-3.5 shrink-0" />
                                                                {itemValue.matricNumber}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                            {formatDateTime(itemValue.startTime)}
                                                        </span>
                                                        {itemValue.slotTitle && (
                                                            <span className="truncate text-slate-500 dark:text-slate-400 font-medium">{itemValue.slotTitle}</span>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                                                        <span className="text-slate-500 dark:text-slate-400">Ref:</span>
                                                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{reference}</span>
                                                        <CopyButton text={reference} title="Copy reference" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-col items-end gap-2 mt-2 sm:mt-0">
                                                {isActionable ? (
                                                    <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors group-hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300">
                                                        Tap to mark outcome <ChevronRight className="h-3.5 w-3.5" />
                                                    </span>
                                                ) : isCompleted ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3 w-3" /> Complete
                                                    </span>
                                                ) : isNoShow ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                                                        <XCircle className="h-3 w-3" /> No-show
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Card>
                                </button>
                            </motion.div>
                        )
                    })}
                </motion.div>
            )}

            <AnimatePresence>
                {selected && (
                    <AppointmentDetailModal
                        appointment={selected}
                        onClose={() => setSelected(null)}
                        onUpdated={load}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}