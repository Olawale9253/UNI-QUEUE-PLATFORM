import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Ticket, Calendar, Clock, User, ArrowRight, Check, Copy, Star,
    CheckCircle2, XCircle, ChevronRight, HelpCircle, Building2,
    ListOrdered, RotateCcw, SkipForward, LogOut, Search
} from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'
import { useUniversityStore } from '../../store/universityStore'
import { useAuthStore } from '../../store/authStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { withAlpha } from '../../lib/colors'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import RatingModal from '../../components/student/RatingModal'

function formatTicketNumber(ticketNumber) {
    if (!ticketNumber) return 'T-0000'
    if (ticketNumber.includes('-')) return ticketNumber
    if (ticketNumber.length > 8) {
        const prefix = ticketNumber.charAt(0)
        const lastFour = ticketNumber.slice(-4)
        return `${prefix}-${lastFour}`
    }
    return ticketNumber
}

function getServiceIcon(name = '') {
    const n = name.toLowerCase()
    if (n.includes('tuition') || n.includes('payment') || n.includes('fee') || n.includes('bursary') || n.includes('finance')) return Ticket
    if (n.includes('medical') || n.includes('health') || n.includes('clinic') || n.includes('screen')) return User
    if (n.includes('portal') || n.includes('ict') || n.includes('it ') || n.includes('computer')) return CheckCircle2
    if (n.includes('password') || n.includes('transcript') || n.includes('document') || n.includes('result')) return ListOrdered
    if (n.includes('library') || n.includes('book')) return ListOrdered
    if (n.includes('register') || n.includes('academic') || n.includes('course')) return Calendar
    return Building2
}

function formatDateTime(dt) {
    if (!dt) return { day: 'N/A', time: '' }
    try {
        const date = new Date(dt)
        const day = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        return { day, time }
    } catch { return { day: 'N/A', time: '' } }
}

function StatusBadge({ status }) {
    const s = status?.toUpperCase()
    let colorClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
    let Icon = CheckCircle2

    if (s === 'COMPLETED') {
        colorClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
        Icon = CheckCircle2
    } else if (s === 'CANCELLED' || s === 'NO_SHOW') {
        colorClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
        Icon = XCircle
    } else if (s === 'WAITING' || s === 'SERVING' || s === 'CALLED') {
        colorClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
        Icon = Clock
    }

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${colorClass}`}>
            <Icon className="h-3 w-3" />
            {status?.replaceAll('_', ' ') || 'Active'}
        </span>
    )
}

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
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    )
}

export default function MyTicketsPage() {
    const { push } = useToastStore()
    const { university } = useUniversityStore()
    const { logout } = useAuthStore()
    const navigate = useNavigate()

    const [activeTicket, setActiveTicket] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [acting, setActing] = useState(null)
    const [activeTab, setActiveTab] = useState('ALL')

    const [ratingTicket, setRatingTicket] = useState(null)
    const shownRatingForTicket = useRef(null)

    const primaryColor = university?.primaryColor || '#4f46e5'

    const loadData = useCallback(async () => {
        try {
            const [activeRes, historyRes] = await Promise.all([
                api.get('/api/user/tickets/active').catch(() => ({ data: { data: null } })),
                api.get('/api/user/tickets/history').catch(() => ({ data: { data: [] } }))
            ])
            setActiveTicket(activeRes.data?.data || null)
            setHistory(historyRes.data?.data || [])
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useAdaptivePoll(loadData, { fastMs: 5000, slowMs: 15000 })

    useEffect(() => {
        if (activeTicket && activeTicket.status === 'COMPLETED') {
            if (shownRatingForTicket.current !== activeTicket.id) {
                setRatingTicket(activeTicket)
                shownRatingForTicket.current = activeTicket.id
            }
        }
    }, [activeTicket])

    const leaveQueue = async () => {
        if (!activeTicket) return
        setActing('leave')
        try {
            await api.post(`/api/user/tickets/${activeTicket.id}/leave`)
            setActiveTicket(null)
            push({ type: 'success', message: 'You have left the queue' })
            loadData()
        } catch (err) {
            console.error("Leave queue error:", err)
            // 👇 Handle expired session or backend crash
            if (err.response?.status === 401 || err.response?.status === 500) {
                push({ type: 'error', message: 'Your session expired. Please log in again.' })
                logout()
                navigate('/login')
            } else {
                push({ type: 'error', message: err.response?.data?.message || err.message || 'Failed to leave queue' })
            }
        } finally {
            setActing(null)
        }
    }

    const handleRated = (ticketId, rating) => {
        setRatingTicket(null)
        setActiveTicket(null)
        push({ type: 'success', message: 'Thank you for your feedback!' })
        loadData()
    }

    const allTickets = useMemo(() => {
        const combined = [...(activeTicket ? [activeTicket] : []), ...history]
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values())
        return unique.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.joinedAt || Date.now())
            const dateB = new Date(b.createdAt || b.joinedAt || Date.now())
            return dateB - dateA
        })
    }, [activeTicket, history])

    const filteredTickets = useMemo(() => {
        if (activeTab === 'ALL') return allTickets
        if (activeTab === 'ACTIVE') return allTickets.filter(t => ['WAITING', 'SERVING', 'CALLED'].includes(t.status?.toUpperCase()))
        if (activeTab === 'COMPLETED') return allTickets.filter(t => t.status?.toUpperCase() === 'COMPLETED')
        if (activeTab === 'CANCELLED') return allTickets.filter(t => ['CANCELLED', 'NO_SHOW'].includes(t.status?.toUpperCase()))
        return allTickets
    }, [allTickets, activeTab])

    if (loading && !activeTicket) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
        )
    }

    const position = activeTicket?.position ?? 1
    const maxPosition = activeTicket?.totalInQueue ?? Math.max(position + 5, 10)
    const progressPercent = Math.min(100, Math.max(5, (position / maxPosition) * 100))
    const isCompleted = activeTicket?.status === 'COMPLETED'
    const isActionable = activeTicket?.status === 'WAITING' || activeTicket?.status === 'CALLED'

    return (
        <div className="space-y-8 pb-12 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        My Ticket
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        View your current ticket, track your queue position, and check the status of all your past tickets.
                    </p>
                </div>
                <div
                    className="hidden md:flex items-center gap-3 rounded-xl border px-4 py-3"
                    style={{
                        backgroundColor: withAlpha(primaryColor, 0.05),
                        borderColor: withAlpha(primaryColor, 0.2)
                    }}
                >
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                            backgroundColor: withAlpha(primaryColor, 0.15),
                            color: primaryColor
                        }}
                    >
                        <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Need help?</div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Have a problem with your ticket? Get support.</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 ml-2" />
                </div>
            </div>

            {activeTicket ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr] gap-4">
                    <Card className="p-6 relative overflow-hidden flex flex-col justify-between" style={{ backgroundColor: withAlpha(primaryColor, 0.03), borderColor: withAlpha(primaryColor, 0.15) }}>
                        <Badge className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 border-emerald-200" variant="success">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Current Ticket
                        </Badge>
                        <div>
                            <div className="flex items-center gap-4 mb-4 mt-2">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}>
                                    <Ticket className="h-7 w-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeTicket.queueName}</h2>
                                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                                        <Building2 className="h-3.5 w-3.5" /> {activeTicket.officeName || 'Academic Office'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDateTime(activeTicket.joinedAt || activeTicket.createdAt).day}</span>
                                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDateTime(activeTicket.joinedAt || activeTicket.createdAt).time}</span>
                            </div>
                        </div>
                        <p className="text-sm font-medium mt-6" style={{ color: primaryColor }}>
                            You are currently in the queue. Please wait for your turn.
                        </p>
                    </Card>

                    <Card className="p-6 flex flex-col justify-between bg-white dark:bg-slate-900">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Your Ticket Number</p>
                            <div className="flex items-center gap-2">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {formatTicketNumber(activeTicket.ticketNumber)}
                                </h2>
                                <CopyButton text={formatTicketNumber(activeTicket.ticketNumber)} />
                            </div>
                        </div>
                        <div className="mt-6">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Position</p>
                            <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white mb-2">
                                <span>{position} / {maxPosition}</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%`, backgroundColor: primaryColor }}
                                />
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-2">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{Math.max(0, position - 1)}</span> people ahead
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6 flex flex-col justify-between bg-white dark:bg-slate-900">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Wait Time</p>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                {activeTicket.estimatedMinutes ?? 20} <span className="text-lg font-bold text-slate-500">mins</span>
                            </h2>
                            <p className="text-[11px] font-medium text-slate-400 mt-1">(Subject to change)</p>
                        </div>

                        <div className="mt-6 flex flex-col gap-2">
                            {isActionable && (
                                <button
                                    onClick={() => navigate(`/student/queues`)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <User className="h-4 w-4" /> View Queue Details <ChevronRight className="h-4 w-4 ml-auto" />
                                </button>
                            )}
                            {isCompleted && (
                                <button
                                    onClick={() => setRatingTicket(activeTicket)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Star className="h-4 w-4" /> Rate Service
                                </button>
                            )}
                            {isActionable && (
                                <button
                                    onClick={leaveQueue}
                                    disabled={!!acting}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                                >
                                    {acting === 'leave' ? 'Leaving...' : 'Leave Queue'}
                                </button>
                            )}
                        </div>
                    </Card>
                </div>
            ) : (
                <Card className="py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <Ticket className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">No active ticket</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                        You are not currently in any queue. Join a service to get started.
                    </p>
                    <Link
                        to="/student/queues"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Join a Service <ArrowRight className="h-4 w-4" />
                    </Link>
                </Card>
            )}

            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">All My Tickets</h2>
                        <p className="text-sm text-slate-500">Track the status of your past and current tickets.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                        {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    activeTab === tab
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {tab === 'ALL' ? 'All Tickets' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Service / Office</th>
                                <th className="px-6 py-4">Ticket No.</th>
                                <th className="px-6 py-4">Position</th>
                                <th className="px-6 py-4">Wait Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                                        No tickets found for this filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((item, idx) => {
                                    const dt = formatDateTime(item.joinedAt || item.createdAt);
                                    const ServiceIcon = getServiceIcon(item.queueName || item.officeName);

                                    return (
                                        <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {dt.day}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium">
                                                    {dt.time}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                                                        style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                                                    >
                                                        <ServiceIcon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {item.queueName || 'Appointment'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {item.officeName || item.staffName || 'University Office'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                                                        {formatTicketNumber(item.ticketNumber)}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                        {item.position ? `${item.position} / ${item.totalInQueue || '—'}` : '—'}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                        {item.estimatedMinutes ? `${item.estimatedMinutes} mins` : '—'}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={item.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate('/student/history')}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                                                >
                                                    View Details <ChevronRight className="h-3 w-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

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