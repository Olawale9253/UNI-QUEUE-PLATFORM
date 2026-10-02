import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CalendarX, Plus, Trash2, Loader2, AlertCircle, RefreshCw,
    Sparkles, Pencil,
} from 'lucide-react'
import api from '../../api/axios'
import Button from '../ui/Button'
import { useToastStore } from '../../store/toastStore'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseDate(iso) {
    if (!iso) return null
    return new Date(iso + 'T00:00:00')
}

function formatFull(iso) {
    const d = parseDate(iso)
    if (!d) return '—'
    return d.toLocaleDateString('en-GB', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
}

function isToday(iso) {
    const d = parseDate(iso)
    if (!d) return false
    const today = new Date()
    return d.getFullYear() === today.getFullYear()
        && d.getMonth() === today.getMonth()
        && d.getDate() === today.getDate()
}

function isPast(iso) {
    const d = parseDate(iso)
    if (!d) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d < today
}

function HolidayCard({ holiday, onDelete }) {
    const d = parseDate(holiday.closedDate)
    const today = isToday(holiday.closedDate)
    const past = isPast(holiday.closedDate)
    const isAuto = holiday.source === 'AUTO'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className={`group relative flex items-center gap-3 rounded-xl border bg-white p-3 transition-all hover:shadow-md dark:bg-slate-900 ${
                today
                    ? 'border-rose-300 bg-rose-50/40 dark:border-rose-800 dark:bg-rose-950/20'
                    : 'border-slate-200 hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-800'
            } ${past ? 'opacity-55' : ''}`}
        >
            {/* Date badge */}
            <div
                className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-lg py-2 ${
                    today
                        ? 'bg-rose-500 text-white'
                        : isAuto
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
            >
                <span className="text-[10px] font-bold uppercase tracking-wider">
                    {MONTHS_SHORT[d.getMonth()]}
                </span>
                <span className="text-xl font-bold leading-none">
                    {String(d.getDate()).padStart(2, '0')}
                </span>
                <span className={`mt-0.5 text-[9px] font-medium uppercase ${today ? 'text-white/80' : 'opacity-70'}`}>
                    {WEEKDAYS_SHORT[d.getDay()]}
                </span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {holiday.reason || 'Public holiday'}
                    </span>
                    {today && (
                        <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Today
                        </span>
                    )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {isAuto ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            Auto
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Pencil className="h-2.5 w-2.5" />
                            Manual
                        </span>
                    )}
                </div>
            </div>

            {/* Delete — hidden until hover */}
            <button
                type="button"
                onClick={() => onDelete(holiday)}
                className="shrink-0 rounded-lg p-2 text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-rose-950/40"
                aria-label="Remove holiday"
                title="Remove"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </motion.div>
    )
}

export default function ClosedDatesPanel() {
    const { push } = useToastStore()
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [date, setDate] = useState('')
    const [reason, setReason] = useState('')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [filter, setFilter] = useState('ALL') // ALL | AUTO | MANUAL

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/admin/closed-dates')
            setList(res.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load closed dates' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    const add = async () => {
        if (!date) {
            push({ type: 'error', message: 'Pick a date first' })
            return
        }
        setSaving(true)
        try {
            await api.post('/api/admin/closed-dates', {
                closedDate: date,
                reason: reason.trim() || null,
            })
            push({ type: 'success', message: 'Closed date added' })
            setDate('')
            setReason('')
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to add' })
        } finally {
            setSaving(false)
        }
    }

    const syncNow = async () => {
        setSyncing(true)
        try {
            const res = await api.post('/api/admin/holidays/sync')
            const { added, skipped, countryCode } = res.data.data
            push({
                type: 'success',
                message: `Synced ${countryCode}: ${added} added, ${skipped} already known`,
            })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Sync failed' })
        } finally {
            setSyncing(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/admin/closed-dates/${deleteTarget.id}`)
            push({ type: 'success', message: 'Closed date removed' })
            setDeleteTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to remove' })
        } finally {
            setDeleting(false)
        }
    }

    // ─── Derived data ───
    const filtered = useMemo(() => {
        if (filter === 'ALL') return list
        if (filter === 'AUTO') return list.filter((d) => d.source === 'AUTO')
        return list.filter((d) => d.source !== 'AUTO')
    }, [list, filter])

    const grouped = useMemo(() => {
        const map = new Map()
        for (const d of filtered) {
            const year = d.closedDate.slice(0, 4)
            if (!map.has(year)) map.set(year, [])
            map.get(year).push(d)
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([year, holidays]) => ({
                year,
                holidays: holidays.sort((a, b) => a.closedDate.localeCompare(b.closedDate)),
            }))
    }, [filtered])

    const counts = useMemo(() => ({
        all: list.length,
        auto: list.filter((d) => d.source === 'AUTO').length,
        manual: list.filter((d) => d.source !== 'AUTO').length,
    }), [list])

    const today = new Date().toISOString().slice(0, 10)

    return (
        <div>
            {/* ─── Add row ─── */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50">
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Add a closed date
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                        loading={syncing}
                        disabled={syncing}
                        onClick={syncNow}
                        title="Fetch public holidays for your country"
                    >
                        {syncing ? 'Syncing…' : 'Sync public holidays'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[170px_1fr_auto]">
                    <input
                        type="date"
                        value={date}
                        min={today}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={255}
                        placeholder="Reason (optional) — e.g. Eid al-Fitr"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                    />
                    <Button
                        type="button"
                        icon={Plus}
                        loading={saving}
                        disabled={saving || !date}
                        onClick={add}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {/* ─── Filter + count ─── */}
            {!loading && list.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/50 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                        {[
                            { key: 'ALL', label: 'All', count: counts.all },
                            { key: 'AUTO', label: 'Auto', count: counts.auto },
                            { key: 'MANUAL', label: 'Manual', count: counts.manual },
                        ].map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setFilter(t.key)}
                                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                    filter === t.key
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {t.label}
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                    filter === t.key
                                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                        : 'bg-slate-200/60 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                                }`}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {counts.all}
                        </span>{' '}
                        {counts.all === 1 ? 'closure' : 'closures'} across{' '}
                        {grouped.length} {grouped.length === 1 ? 'year' : 'years'}
                    </div>
                </div>
            )}

            {/* ─── List ─── */}
            <div className="mt-5">
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                        ))}
                    </div>
                ) : list.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <CalendarX className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                No closed dates yet
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Click <strong>Sync public holidays</strong> to import your
                                country's national holidays, or add specific dates manually.
                            </p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                        No {filter === 'AUTO' ? 'auto-synced' : 'manual'} entries.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {grouped.map(({ year, holidays }) => (
                            <section key={year}>
                                {/* Year header */}
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {year}
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700" />
                                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {holidays.length} {holidays.length === 1 ? 'entry' : 'entries'}
                                    </div>
                                </div>

                                {/* Grid of holiday cards */}
                                <motion.div layout className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                    <AnimatePresence mode="popLayout">
                                        {holidays.map((d) => (
                                            <HolidayCard
                                                key={d.id}
                                                holiday={d}
                                                onDelete={setDeleteTarget}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Delete confirm ─── */}
            <AnimatePresence>
                {deleteTarget && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !deleting && setDeleteTarget(null)}
                            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40">
                                        <AlertCircle className="h-5 w-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            Remove this closed date?
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {formatFull(deleteTarget.closedDate)}
                                            {deleteTarget.reason && ` · ${deleteTarget.reason}`}
                                            {' '}will no longer be a holiday.
                                            {deleteTarget.source === 'AUTO' && (
                                                <span className="mt-2 block font-medium text-amber-700 dark:text-amber-400">
                                                    Auto-synced entries may reappear on the next sync.
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setDeleteTarget(null)}
                                        disabled={deleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        loading={deleting}
                                        disabled={deleting}
                                        onClick={confirmDelete}
                                        className="bg-rose-600 hover:bg-rose-700"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}