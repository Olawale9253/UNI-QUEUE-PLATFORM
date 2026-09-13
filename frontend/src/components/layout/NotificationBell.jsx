import { useEffect, useState, useRef, useCallback } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { formatTimeAgo } from '../../lib/format'

export default function NotificationBell() {
    const { token } = useAuthStore()
    const [open, setOpen] = useState(false)
    const [unread, setUnread] = useState(0)
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(false)
    const ref = useRef(null)

    const loadUnreadCount = useCallback(async () => {
        if (!token) return
        try {
            const res = await api.get('/api/notifications/unread/count')
            setUnread(res.data.data?.count ?? 0)
        } catch {
            // silent — bell shouldn't break anything
        }
    }, [token])

    const loadNotifications = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get('/api/notifications')
            setNotifications(res.data.data || [])
        } catch {
            setNotifications([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadUnreadCount()
        const interval = setInterval(loadUnreadCount, 30000)
        return () => clearInterval(interval)
    }, [loadUnreadCount])

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    useEffect(() => {
        if (open) loadNotifications()
    }, [open, loadNotifications])

    const markOneRead = async (id) => {
        try {
            await api.post(`/api/notifications/${id}/read`)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            )
            setUnread((v) => Math.max(0, v - 1))
        } catch {
            // ignore
        }
    }

    const markAllRead = async () => {
        try {
            await api.post('/api/notifications/read-all')
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
            setUnread(0)
        } catch {
            // ignore
        }
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                <AnimatePresence>
                    {unread > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white"
                        >
                            {unread > 9 ? '9+' : unread}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-2 w-96 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Notifications
                            </h3>
                            {unread > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="px-4 py-12 text-center text-sm text-slate-500">
                                    Loading…
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="px-4 py-12 text-center text-sm text-slate-500">
                                    No notifications yet.
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {notifications.slice(0, 20).map((n) => (
                                        <li
                                            key={n.id}
                                            className={`px-4 py-3 transition-colors ${
                                                !n.isRead ? 'bg-indigo-50/40' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-sm font-medium text-slate-900">
                                                            {n.title}
                                                        </p>
                                                        {!n.isRead && (
                                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                                                        {n.message}
                                                    </p>
                                                    <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                                                        {formatTimeAgo(n.createdAt)}
                                                    </p>
                                                </div>
                                                {!n.isRead && (
                                                    <button
                                                        onClick={() => markOneRead(n.id)}
                                                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                                                        aria-label="Mark read"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}