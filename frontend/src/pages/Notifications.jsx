import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Bell, CheckCircle2, Info, AlertTriangle, Loader2,
    CheckCheck, ArrowRight, Ticket, Megaphone, User
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { useToastStore } from '../store/toastStore'
import { formatTimeAgo } from '../lib/format'
import { stagger, staggerItem } from '../lib/motion'

const TABS = [
    { id: 'all', label: 'All Notifications' },
    { id: 'unread', label: 'Unread' },
]

export default function Notifications() {
    const { push } = useToastStore()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('all')
    const [markingAll, setMarkingAll] = useState(false)

    const load = async () => {
        try {
            const res = await api.get('/api/notifications')
            setNotifications(res.data?.data || [])
            setError(null)
        } catch (err) {
            setError('Failed to load notifications. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const markAllRead = async () => {
        setMarkingAll(true)
        try {
            await api.post('/api/notifications/read-all')
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
            push({ type: 'success', message: 'All notifications marked as read' })
        } catch {
            push({ type: 'error', message: 'Failed to mark all as read' })
        } finally {
            setMarkingAll(false)
        }
    }

    const markOneRead = async (id) => {
        const notif = notifications.find((n) => n.id === id)
        if (!notif || notif.isRead) return

        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
        try {
            await api.post(`/api/notifications/${id}/read`)
        } catch {
            // silently fail, the poll will resync
        }
    }

    const filtered = useMemo(() => {
        return activeTab === 'unread'
            ? notifications.filter((n) => !n.isRead)
            : notifications
    }, [notifications, activeTab])

    const unreadCount = notifications.filter((n) => !n.isRead).length

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="mx-auto max-w-3xl space-y-6 pb-12">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/20">
                    <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
                    <h2 className="text-base font-bold text-rose-800 dark:text-rose-300">Couldn't load notifications</h2>
                    <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{error}</p>
                    <Button onClick={load} className="mt-4">Try Again</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Notification Center
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Stay updated with your queue tickets, broadcasts, and system alerts.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        onClick={markAllRead}
                        loading={markingAll}
                        icon={CheckCheck}
                        variant="secondary"
                    >
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                            activeTab === tab.id
                                ? 'text-brand-600 dark:text-brand-400'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        {tab.label}
                        {tab.id === 'unread' && unreadCount > 0 && (
                            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                                {unreadCount}
                            </span>
                        )}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="notif-tab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            <Card padded={false} className="overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <Bell className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">All caught up!</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {activeTab === 'unread' ? 'You have no unread notifications.' : 'You have no notifications yet.'}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.ul
                            variants={stagger(0, 0.03)}
                            initial="initial"
                            animate="animate"
                            className="divide-y divide-slate-100 dark:divide-slate-800"
                        >
                            {filtered.map((n) => {
                                const isUnread = !n.isRead
                                const type = (n.type || 'SYSTEM').toUpperCase()

                                // Determine Icon and Color based on type
                                let Icon = Bell
                                let colorClass = 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'

                                if (type.includes('BROADCAST')) {
                                    Icon = Megaphone
                                    colorClass = 'text-brand-600 bg-brand-50 dark:bg-brand-950/40 dark:text-brand-400'
                                } else if (type.includes('TICKET')) {
                                    Icon = Ticket
                                    colorClass = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400'
                                } else if (type.includes('SUCCESS')) {
                                    Icon = CheckCircle2
                                    colorClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
                                } else if (type.includes('WARNING')) {
                                    Icon = AlertTriangle
                                    colorClass = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400'
                                }

                                return (
                                    <motion.li
                                        key={n.id}
                                        variants={staggerItem}
                                        onClick={() => markOneRead(n.id)}
                                        className={`group flex gap-4 p-4 sm:px-6 transition-colors cursor-pointer ${
                                            isUnread
                                                ? 'bg-brand-50/30 hover:bg-brand-50/60 dark:bg-brand-950/10 dark:hover:bg-brand-950/20'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                        }`}
                                    >
                                        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`truncate text-sm ${isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                                                        {n.title || 'Notification'}
                                                    </h4>
                                                    {isUnread && (
                                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                                    )}
                                                </div>
                                                <span className="shrink-0 text-xs text-slate-400">
                                                    {formatTimeAgo(n.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`mt-1 text-sm leading-relaxed ${isUnread ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {n.message}
                                            </p>

                                            {n.link && (
                                                <div className="mt-2">
                                                    <Link
                                                        to={n.link}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                                    >
                                                        View Details <ArrowRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </motion.li>
                                )
                            })}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </Card>
        </div>
    )
}