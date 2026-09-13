import { useEffect, useState, useRef, useCallback } from 'react'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
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
            // silent
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

    // Close on outside click
    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    // Close on Escape
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [])

    // Prevent body scroll on mobile when open
    useEffect(() => {
        if (open && window.innerWidth < 640) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [open])

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
                    <>
                        {/* Mobile backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm sm:hidden"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className="
                fixed inset-x-3 top-20 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl
                sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 sm:rounded-lg sm:shadow-lg
              "
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Notifications
                                    {unread > 0 && (
                                        <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {unread} new
                    </span>
                                    )}
                                </h3>
                                <div className="flex items-center gap-1">
                                    {unread > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                                        >
                                            <CheckCheck className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Mark all read</span>
                                            <span className="sm:hidden">All read</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:hidden"
                                        aria-label="Close"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto sm:max-h-96">
                                {loading ? (
                                    <div className="px-4 py-12 text-center text-sm text-slate-500">
                                        Loading…
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-4 py-12 text-center">
                                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                            <Bell className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-900">
                                            No notifications
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            You're all caught up.
                                        </p>
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
                                                    <div className="min-w-0 flex-1">
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
                                                            className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
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
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}