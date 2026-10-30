import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCircle2, Ticket, AlertCircle, Info, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useUniversityStore } from '../../store/universityStore'
import { withAlpha } from '../../lib/colors'

// Helper to format relative time (e.g., "2h ago")
function timeAgo(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Helper to get icon based on notification type
function getNotificationIcon(title = '', type = '') {
    const t = `${title} ${type}`.toLowerCase()
    if (t.includes('turn') || t.includes('called')) return Ticket
    if (t.includes('complete') || t.includes('served')) return CheckCircle2
    if (t.includes('queue') || t.includes('joined')) return Ticket
    if (t.includes('alert') || t.includes('error') || t.includes('missed')) return AlertCircle
    return Info
}

export default function NotificationBell() {
    const { university } = useUniversityStore()
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const dropdownRef = useRef(null)

    const primaryColor = university?.primaryColor || '#4f46e5'

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications').catch(() => ({ data: { data: [] } }))
            setNotifications(res.data?.data || [])
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const unreadCount = notifications.filter(n => !n.isRead).length

    const markAllAsRead = async () => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        try {
            await api.post('/api/notifications/read-all')
        } catch {
            fetchNotifications() // Revert if it fails
        }
    }

    const markAsRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        try {
            await api.post(`/api/notifications/${id}/read`)
        } catch {
            fetchNotifications()
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                )}
            </button>

            {/* Premium Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40 z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span
                                        className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                                    style={{ color: primaryColor }}
                                >
                                    <Check className="h-3.5 w-3.5" /> Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse flex gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-2 bg-slate-200 rounded w-1/2 dark:bg-slate-700" />
                                                <div className="h-2 bg-slate-200 rounded w-3/4 dark:bg-slate-700" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                                        <Bell className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">You're all caught up!</p>
                                    <p className="text-xs text-slate-500 mt-1">No new notifications at the moment.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {notifications.map((notification) => {
                                        const Icon = getNotificationIcon(notification.title, notification.type)
                                        const isUnread = !notification.isRead

                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => markAsRead(notification.id)}
                                                className={`relative flex gap-3 p-4 transition-colors cursor-pointer ${
                                                    isUnread
                                                        ? 'bg-slate-50/50 dark:bg-slate-800/20'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                                }`}
                                            >
                                                {/* Unread indicator line */}
                                                {isUnread && (
                                                    <div
                                                        className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                                                        style={{ backgroundColor: primaryColor }}
                                                    />
                                                )}

                                                <div
                                                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                        isUnread
                                                            ? 'text-white'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}
                                                    style={isUnread ? { backgroundColor: withAlpha(primaryColor, 0.15), color: primaryColor } : undefined}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm leading-tight ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-slate-400 mt-1.5">
                                                        {timeAgo(notification.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-900/50">
                            <Link
                                to="/student/notifications"
                                onClick={() => setIsOpen(false)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                View all notifications
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}