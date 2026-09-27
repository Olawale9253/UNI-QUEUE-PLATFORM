import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Ticket, Clock, Building2, Star, CheckCircle2,
    XCircle, AlertCircle, Copy, Check, Filter,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/Skeleton'
import RatingModal from '../../components/student/RatingModal'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

const STATUS_VARIANTS = {
    WAITING: 'warning',
    WAITLISTED: 'info',
    CALLED: 'indigo',
    SERVING: 'indigo',
    COMPLETED: 'success',
    NO_SHOW: 'danger',
    CANCELLED: 'default',
    TRANSFERRED: 'default',
}

const STATUS_LABELS = {
    WAITING: 'Waiting',
    WAITLISTED: 'Waitlisted',
    CALLED: 'Called',
    SERVING: 'Serving',
    COMPLETED: 'Completed',
    NO_SHOW: 'No-show',
    CANCELLED: 'Cancelled',
    TRANSFERRED: 'Transferred',
}

const FILTERS = [
    { value: 'ALL', label: 'All' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'WAITING', label: 'Waiting' },
    { value: 'CALLED', label: 'Called' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'NO_SHOW', label: 'No-show' },
]

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false)
    const copy = async (e) => {
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {}
    }
    return (
        <button
            type="button"
            onClick={copy}
            title="Copy ticket ID"
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
            {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
                <Copy className="h-3.5 w-3.5" />
            )}
        </button>
    )
}

function InitialBadge({ queueName, ticketNumber }) {
    const letter =
        queueName?.charAt(0).toUpperCase() ||
        ticketNumber?.charAt(0).toUpperCase() ||
        '#'
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {letter}
        </div>
    )
}

function formatDateTime(dt) {
    if (!dt) return null
    try {
        return new Date(dt).toLocaleString([], {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return null
    }
}

export default function HistoryTab() {
    const { push } = useToastStore()
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('ALL')
    const [ratingTicket, setRatingTicket] = useState(null)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/user/tickets/history')
            setTickets(res.data?.data || [])
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to load history',
            })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 10000, slowMs: 30000 })

    const handleRated = (ticketId, rating) => {
        setTickets((prev) =>
            prev.map((t) =>
                t.id === ticketId ? { ...t, rated: true, rating } : t
            )
        )
        setRatingTicket(null)
    }

    const filtered = useMemo(() => {
        let list = tickets

        if (filter !== 'ALL') {
            list = list.filter((t) => t.status === filter)
        }

        if (search.trim()) {
            const s = search.trim().toLowerCase()
            list = list.filter(
                (t) =>
                    t.ticketNumber?.toLowerCase().includes(s) ||
                    t.queueName?.toLowerCase().includes(s) ||
                    t.officeName?.toLowerCase().includes(s)
            )
        }

        return [...list].sort((a, b) => {
            const at = a.joinedAt ? new Date(a.joinedAt).getTime() : 0
            const bt = b.joinedAt ? new Date(b.joinedAt).getTime() : 0
            return bt - at
        })
    }, [tickets, filter, search])

    const statusCounts = useMemo(() => {
        const counts = { ALL: tickets.length }
        FILTERS.forEach((f) => {
            if (f.value === 'ALL') return
            counts[f.value] = tickets.filter((t) => t.status === f.value).length
        })
        return counts
    }, [tickets])

    if (loading) {
        return (
            <div>
                <div className="mb-5">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        History
                    </h2>
                </div>
                <Card padded={false}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonRow key={i} />
                    ))}
                </Card>
            </div>
        )
    }

    return (
        <div>
            {/* ═══ Sticky top: title + search + filters ═══ */}
            <div className="sticky top-[120px] z-20 -mx-3 mb-4 bg-slate-50/95 px-3 pb-3 pt-2 backdrop-blur-sm dark:bg-slate-950/95 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
                {/* Page title */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        History
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Every queue you've joined. Rate completed tickets to help improve service.
                    </p>
                </div>

                {/* Search */}
                {tickets.length > 0 && (
                    <div className="mb-3">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by ticket ID or queue name"
                                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                            />
                        </div>
                    </div>
                )}

                {/* Filter chips */}
                {tickets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {FILTERS.map((f) => {
                            const count = statusCounts[f.value] ?? 0
                            const isActive = filter === f.value
                            return (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => setFilter(f.value)}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                        isActive
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                            : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {f.label}
                                    <span
                                        className={`text-[10px] font-bold ${
                                            isActive ? 'opacity-80' : 'opacity-60'
                                        }`}
                                    >
                    {count}
                  </span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ═══ Ticket list ═══ */}
            {tickets.length === 0 ? (
                <EmptyState
                    icon={Ticket}
                    title="No ticket history yet"
                    description="Once you join a queue, your tickets will appear here."
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Filter}
                    title="No tickets match"
                    description={
                        search.trim()
                            ? 'Try a different search term.'
                            : 'Try a different filter.'
                    }
                    action={
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setFilter('ALL')
                                setSearch('')
                            }}
                        >
                            Clear filters
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {filtered.map((t, idx) => {
                        const isCompleted = t.status === 'COMPLETED'
                        const canRate = isCompleted && !t.rated

                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                            >
                                <Card>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 flex-1 items-start gap-4">
                                            <InitialBadge
                                                queueName={t.queueName || t.officeName}
                                                ticketNumber={t.ticketNumber}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                            {t.ticketNumber}
                          </span>
                                                    <CopyButton text={t.ticketNumber} />
                                                    <Badge variant={STATUS_VARIANTS[t.status] || 'default'}>
                                                        {STATUS_LABELS[t.status] || t.status}
                                                    </Badge>
                                                </div>

                                                {(t.queueName || t.officeName) && (
                                                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                        <span className="truncate">
                              {t.queueName || t.officeName}
                            </span>
                                                    </div>
                                                )}

                                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {t.joinedAt && (
                                                        <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Joined {formatDateTime(t.joinedAt)}
                            </span>
                                                    )}
                                                    {t.completedAt && (
                                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed {formatDateTime(t.completedAt)}
                            </span>
                                                    )}
                                                    {t.status === 'NO_SHOW' && (
                                                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                              <AlertCircle className="h-3 w-3" />
                              Marked as no-show
                            </span>
                                                    )}
                                                    {t.status === 'CANCELLED' && (
                                                        <span className="flex items-center gap-1 text-slate-500">
                              <XCircle className="h-3 w-3" />
                              Cancelled
                            </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {canRate && (
                                            <div className="shrink-0 sm:pt-1">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon={Star}
                                                    onClick={() => setRatingTicket(t)}
                                                >
                                                    Rate service
                                                </Button>
                                            </div>
                                        )}

                                        {isCompleted && t.rated && (
                                            <div className="shrink-0 text-xs text-slate-500 sm:pt-2 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          Rated {t.rating ?? ''}
                        </span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <AnimatePresence>
                {ratingTicket && (
                    <RatingModal
                        ticket={ratingTicket}
                        onClose={() => setRatingTicket(null)}
                        onRated={handleRated}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}