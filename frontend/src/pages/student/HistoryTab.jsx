import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Ticket, Clock, Building2, Star, CheckCircle2,
    XCircle, AlertCircle, Calendar, Briefcase, ChevronRight,
    Filter, ArrowUpRight, History as HistoryIcon, ListOrdered
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

// 👇 HELPER: Formats old long ticket IDs into short Q-XXXX format
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

const STATUS_VARIANTS = {
    WAITING: 'warning',
    WAITLISTED: 'info',
    CALLED: 'indigo',
    SERVING: 'indigo',
    COMPLETED: 'success',
    NO_SHOW: 'danger',
    CANCELLED: 'default',
    TRANSFERRED: 'default',
    BOOKED: 'info',
    UPCOMING: 'warning',
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
    BOOKED: 'Booked',
    UPCOMING: 'Upcoming',
}

const TABS = [
    { id: 'ALL', label: 'All History' },
    { id: 'QUEUE', label: 'Queue History' },
    { id: 'APPOINTMENT', label: 'Appointment History' },
    { id: 'OFFICE', label: 'Office Visits' },
]

function formatDateTime(dt) {
    if (!dt) return null
    try {
        const date = new Date(dt)
        const day = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        return { day, time }
    } catch { return null }
}

export default function HistoryTab() {
    const { push } = useToastStore()
    const navigate = useNavigate()

    const [tickets, setTickets] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState('ALL')
    const [ratingTicket, setRatingTicket] = useState(null)

    const load = useCallback(async () => {
        try {
            const [ticketRes, apptRes] = await Promise.all([
                api.get('/api/user/tickets/history').catch(() => ({ data: { data: [] } })),
                api.get('/api/appointments').catch(() => ({ data: { data: [] } }))
            ])
            setTickets(ticketRes.data?.data || [])
            setAppointments(apptRes.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load history' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 10000, slowMs: 30000 })

    const handleRated = (ticketId, rating) => {
        setTickets((prev) => prev.map((item) => item.id === ticketId ? { ...item, rated: true, rating } : item))
        setRatingTicket(null)
    }

    const combinedHistory = useMemo(() => {
        const queueItems = tickets.map(t => ({
            ...t,
            historyType: 'QUEUE',
            dateObj: new Date(t.joinedAt || t.createdAt || Date.now()),
        }))
        const apptItems = appointments.map(a => ({
            ...a,
            historyType: 'APPOINTMENT',
            dateObj: new Date(a.date || a.createdAt || Date.now()),
        }))
        return [...queueItems, ...apptItems].sort((a, b) => b.dateObj - a.dateObj)
    }, [tickets, appointments])

    const stats = useMemo(() => {
        const completedTickets = tickets.filter(t => t.status === 'COMPLETED').length
        const uniqueOffices = new Set(tickets.map(t => t.officeName).filter(Boolean)).size
        const successRate = tickets.length > 0 ? Math.round((completedTickets / tickets.length) * 100) : 100

        return {
            queueVisits: tickets.length,
            appointments: appointments.length,
            offices: uniqueOffices,
            successRate
        }
    }, [tickets, appointments])

    const filtered = useMemo(() => {
        let list = combinedHistory
        if (activeTab === 'QUEUE') list = list.filter(i => i.historyType === 'QUEUE')
        if (activeTab === 'APPOINTMENT') list = list.filter(i => i.historyType === 'APPOINTMENT')
        if (activeTab === 'OFFICE') {
            const offices = new Map()
            list.forEach(i => {
                if (i.officeName && !offices.has(i.officeName)) {
                    offices.set(i.officeName, i)
                }
            })
            list = Array.from(offices.values())
        }

        if (search.trim()) {
            const s = search.trim().toLowerCase()
            list = list.filter(i =>
                i.ticketNumber?.toLowerCase().includes(s) ||
                i.queueName?.toLowerCase().includes(s) ||
                i.officeName?.toLowerCase().includes(s) ||
                i.staffName?.toLowerCase().includes(s)
            )
        }
        return list
    }, [combinedHistory, activeTab, search])

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <Card padded={false}><SkeletonList count={5} /></Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        History
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                        View your past queue activities, appointments, and office visits. Keep track of your completed services and get quick access to details anytime.
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-900/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300">
                        <HistoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Your Activity History</div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">All your past queues, appointments and office visits in one place.</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="flex items-center gap-4 p-5 bg-blue-50/30 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        <Ticket className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Queue Visits</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.queueVisits}</p>
                        <p className="text-[11px] text-slate-400">Total queues joined</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 p-5 bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Appointments</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.appointments}</p>
                        <p className="text-[11px] text-slate-400">Completed appointments</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 p-5 bg-purple-50/30 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Office Visits</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.offices}</p>
                        <p className="text-[11px] text-slate-400">Offices services accessed</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 p-5 bg-teal-50/30 border-teal-100 dark:bg-teal-950/20 dark:border-teal-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Success Rate</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.successRate}%</p>
                        <p className="text-[11px] text-slate-400">Completed successfully</p>
                    </div>
                </Card>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                <div className="flex flex-wrap items-center gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 px-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search history..."
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={HistoryIcon}
                    title="No history found"
                    description={search ? "Try adjusting your search terms." : "You haven't participated in any queues or appointments yet."}
                    action={<Button icon={ListOrdered} onClick={() => navigate('/student/queues')}>Browse queues</Button>}
                />
            ) : (
                <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Service / Office</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {filtered.map((item, idx) => {
                                const dt = formatDateTime(item.joinedAt || item.date);
                                const isQueue = item.historyType === 'QUEUE';
                                const canRate = isQueue && item.status === 'COMPLETED' && !item.rated;

                                return (
                                    <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {dt?.day || 'N/A'}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium">
                                                {dt?.time || ''}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isQueue ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {isQueue ? <Ticket className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
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
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {isQueue ? (
                                                    <>Ticket No: <span className="font-mono text-slate-900 dark:text-white">{formatTicketNumber(item.ticketNumber)}</span></>
                                                ) : (
                                                    <>Staff: <span className="text-slate-900 dark:text-white">{item.staffName || 'Assigned Staff'}</span></>
                                                )}
                                            </div>
                                            {isQueue && item.position && (
                                                <div className="text-xs text-slate-500 mt-1">Position: {item.position}</div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <Badge variant={STATUS_VARIANTS[item.status] || 'default'}>
                                                {STATUS_LABELS[item.status] || item.status}
                                            </Badge>
                                            {item.status === 'COMPLETED' && item.completedAt && (
                                                <div className="text-[11px] text-slate-400 mt-1">Served at {new Date(item.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            {canRate ? (
                                                <Button variant="secondary" size="sm" icon={Star} onClick={() => setRatingTicket(item)}>Rate</Button>
                                            ) : (
                                                <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    View Details <ChevronRight className="h-3 w-3" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 dark:bg-slate-800/50 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div>Showing 1 - {filtered.length} of {filtered.length} results</div>
                    </div>
                </Card>
            )}

            <AnimatePresence>
                {ratingTicket && <RatingModal ticket={ratingTicket} onClose={() => setRatingTicket(null)} onRated={handleRated} />}
            </AnimatePresence>
        </div>
    )
}