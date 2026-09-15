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
    const [processing, setProcessing] = useState(null) // id being processed
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

    const markOneRead = async (notification) => {
        if (notification.isRead) return // already read
        setProcessing(notification.id)
        try {
            await api.post(`/api/notifications/${notification.id}/read`)
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
            )
            setUnread((v) => Math.max(0, v - 1))
        } catch {
            // ignore — will retry on next poll
        } finally {
            setProcessing(null)
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

    const unreadCount = notifications.filter((n) => !n.isRead).length

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
                sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[420px] sm:rounded-lg sm:shadow-lg
              "
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                      {unreadCount} new
                    </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
                                        >
                                            <CheckCheck className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Mark all read</span>
                                            <span className="sm:hidden">All</span>
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
                            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto sm:max-h-[500px]">
                                {loading ? (
                                    <div className="space-y-3 p-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="animate-pulse space-y-2 rounded-lg bg-slate-50 p-3">
                                                <div className="h-3 w-1/3 rounded bg-slate-200" />
                                                <div className="h-3 w-full rounded bg-slate-200" />
                                                <div className="h-3 w-2/3 rounded bg-slate-200" />
                                            </div>
                                        ))}
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-4 py-12 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                            <Bell className="h-6 w-6 text-slate-400" />
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
                                        {notifications.slice(0, 30).map((n) => {
                                            const isUnread = !n.isRead
                                            const isProcessing = processing === n.id

                                            return (
                                                <li
                                                    key={n.id}
                                                    onClick={() => markOneRead(n)}
                                                    className={`relative cursor-pointer px-4 py-3 transition-colors ${
                                                        isUnread
                                                            ? 'bg-brand-50/40 hover:bg-brand-50/70'
                                                            : 'bg-white hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {/* Unread indicator bar */}
                                                    {isUnread && (
                                                        <motion.div
                                                            layoutId={`unread-bar-${n.id}`}
                                                            className="absolute left-0 top-0 h-full w-1 bg-brand-600"
                                                        />
                                                    )}

                                                    <div className="flex items-start gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            {/* Title row */}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex min-w-0 items-center gap-2">
                                                                    {isUnread && (
                                                                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                                                                    )}
                                                                    <p
                                                                        className={`truncate ${
                                                                            isUnread
                                                                                ? 'text-sm font-semibold text-slate-900'
                                                                                : 'text-sm font-medium text-slate-700'
                                                                        }`}
                                                                    >
                                                                        {n.title}
                                                                    </p>
                                                                </div>

                                                                {isUnread ? (
                                                                    isProcessing ? (
                                                                        <div className="shrink-0 rounded-full bg-slate-100 p-1">
                                                                            <Check className="h-3.5 w-3.5 text-slate-400" />
                                                                        </div>
                                                                    ) : null
                                                                ) : (
                                                                    <CheckCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                                )}
                                                            </div>

                                                            {/* Full message — no truncation */}
                                                            <p
                                                                className={`mt-1 whitespace-pre-wrap text-xs leading-relaxed ${
                                                                    isUnread
                                                                        ? 'text-slate-700'
                                                                        : 'text-slate-500'
                                                                }`}
                                                            >
                                                                {n.message}
                                                            </p>

                                                            {/* Footer */}
                                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                                    {formatTimeAgo(n.createdAt)}
                                                                </p>
                                                                {n.type && (
                                                                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                    {String(n.type).replace(/_/g, ' ')}
                                  </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="border-t border-slate-100 px-4 py-2 text-center">
                  <span className="text-xs text-slate-500">
                    Click a notification to mark it as read
                  </span>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}