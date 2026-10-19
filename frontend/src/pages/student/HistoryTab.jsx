import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Ticket, Clock, Building2, Star, CheckCircle2,
    XCircle, AlertCircle, Copy, Check, Filter, ArrowRight,
    History as HistoryIcon, ListOrdered,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonList } from '../../components/ui/Skeleton'
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
    const copy = async (event) => {
        event.stopPropagation()
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
    const navigate = useNavigate()
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
                message: err.message || 'Failed to load history',
            })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 10000, slowMs: 30000 })

    const handleRated = (ticketId, rating) => {
        setTickets((prev) =>
            prev.map((item) =>
                item.id === ticketId ? { ...item, rated: true, rating } : item
            )
        )
        setRatingTicket(null)
    }

    const filtered = useMemo(() => {
        let list = tickets

        if (filter !== 'ALL') {
            list = list.filter((item) => item.status === filter)
        }

        if (search.trim()) {
            const stringValue = search.trim().toLowerCase()
            list = list.filter(
                (item) =>
                    item.ticketNumber?.toLowerCase().includes(stringValue) ||
                    item.queueName?.toLowerCase().includes(stringValue) ||
                    item.officeName?.toLowerCase().includes(stringValue)
            )
        }

        return [...list].sort((firstValue, secondValue) => {
            const at = firstValue.joinedAt ? new Date(firstValue.joinedAt).getTime() : 0
            const bt = secondValue.joinedAt ? new Date(secondValue.joinedAt).getTime() : 0
            return bt - at
        })
    }, [tickets, filter, search])

    const statusCounts = useMemo(() => {
        const counts = { ALL: tickets.length }
        FILTERS.forEach((item) => {
            if (item.value === 'ALL') return
            counts[item.value] = tickets.filter((ticket) => ticket.status === item.value).length
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
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Every queue you've joined. Rate completed tickets to help improve service.
                    </p>
                </div>
                <Card padded={false}>
                    <SkeletonList count={5} />
                </Card>
            </div>
        )
    }

    return (
        <div>
            {/* ═══ Sticky top: title + search + filters ═══ */}
            <div className="sticky top-[120px] z-20 -mx-3 mb-4 bg-slate-50/95 px-3 pb-3 pt-2 backdrop-blur-sm dark:bg-slate-950/95 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        History
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Every queue you've joined. Rate completed tickets to help improve service.
                    </p>
                </div>

                {tickets.length > 0 && (
                    <>
                        <div className="mb-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search by ticket ID or queue name"
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {FILTERS.map((item) => {
                                const count = statusCounts[item.value] ?? 0
                                const isActive = filter === item.value
                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setFilter(item.value)}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                            isActive
                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {item.label}
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
                    </>
                )}
            </div>

            {/* ═══ Ticket list ═══ */}
            {tickets.length === 0 ? (
                <EmptyState
                    icon={HistoryIcon}
                    title="No ticket history yet"
                    description="Once you join a queue, every ticket you collect will appear here with its wait time and outcome."
                    action={
                        <Button
                            icon={ListOrdered}
                            onClick={() => navigate('/student/queues')}
                        >
                            Browse queues
                        </Button>
                    }
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Filter}
                    variant="info"
                    title="No tickets match"
                    description={
                        search.trim()
                            ? 'Try a different search term or clear the filter.'
                            : 'No tickets with this status yet.'
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
                    {filtered.map((itemValue, idx) => {
                        const isCompleted = itemValue.status === 'COMPLETED'
                        const canRate = isCompleted && !itemValue.rated

                        return (
                            <motion.div
                                key={itemValue.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                            >
                                <Card>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 flex-1 items-start gap-4">
                                            <InitialBadge
                                                queueName={itemValue.queueName || itemValue.officeName}
                                                ticketNumber={itemValue.ticketNumber}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                                                        {itemValue.ticketNumber}
                                                    </span>
                                                    <CopyButton text={itemValue.ticketNumber} />
                                                    <Badge variant={STATUS_VARIANTS[itemValue.status] || 'default'}>
                                                        {STATUS_LABELS[itemValue.status] || itemValue.status}
                                                    </Badge>
                                                </div>

                                                {(itemValue.queueName || itemValue.officeName) && (
                                                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                        <span className="truncate">
                                                            {itemValue.queueName || itemValue.officeName}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {itemValue.joinedAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Joined {formatDateTime(itemValue.joinedAt)}
                                                        </span>
                                                    )}
                                                    {itemValue.completedAt && (
                                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Completed {formatDateTime(itemValue.completedAt)}
                                                        </span>
                                                    )}
                                                    {itemValue.status === 'NO_SHOW' && (
                                                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Marked as no-show
                                                        </span>
                                                    )}
                                                    {itemValue.status === 'CANCELLED' && (
                                                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
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
                                                    onClick={() => setRatingTicket(itemValue)}
                                                >
                                                    Rate service
                                                </Button>
                                            </div>
                                        )}

                                        {isCompleted && itemValue.rated && (
                                            <div className="shrink-0 text-xs text-slate-500 sm:pt-2 dark:text-slate-400">
                                                <span className="inline-flex items-center gap-1">
                                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                    Rated {itemValue.rating ?? ''}
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