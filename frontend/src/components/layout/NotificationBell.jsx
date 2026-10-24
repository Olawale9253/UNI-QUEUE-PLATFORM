import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, X as CloseIcon, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { formatTimeAgo } from '../../lib/format'
import { playAttentionSound } from '../../lib/soundService'
import { usePrefsStore } from '../../store/prefsStore'
import { syncBus } from '../../lib/syncBus'

const SOUND_DEBOUNCE_MS = 1200

const dashboards = {
    SUPER_ADMIN: '/super-admin',
    ADMIN: '/admin',
    STAFF: '/staff',
    USER: '/student',
    FRESHER: '/student',
}

export default function NotificationBell() {
    const { user, token } = useAuthStore() // 🔧 Added user
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [unread, setUnread] = useState(0)
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(null)
    const ref = useRef(null)

    const lastSoundAtRef = useRef(0)

    const tryPlayChime = useCallback(() => {
        const soundOn = usePrefsStore.getState().prefs.soundEnabled !== false
        if (!soundOn) return
        const now = Date.now()
        if (now - lastSoundAtRef.current < SOUND_DEBOUNCE_MS) return
        lastSoundAtRef.current = now
        try { playAttentionSound() } catch { }
    }, [])

    const loadUnreadCount = useCallback(
        async (opts = {}) => {
            if (!token) return
            try {
                const res = await api.get('/api/notifications/unread/count')
                const next = res.data.data?.count ?? 0
                setUnread((prev) => {
                    if (next > prev && !opts.silent) tryPlayChime()
                    return next
                })
            } catch { }
        },
        [token, tryPlayChime]
    )

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
        const interval = setInterval(() => loadUnreadCount({ silent: true }), 600000)
        return () => clearInterval(interval)
    }, [loadUnreadCount])

    useEffect(() => {
        if (!token) return undefined
        const unsub = syncBus.subscribe('notification:new', () => {
            tryPlayChime()
            setUnread((prev) => prev + 1)
            if (open) loadNotifications()
        })
        const unsub2 = syncBus.subscribe('data-changed', (payload) => {
            if (payload?.source === 'sse' && payload?.serverTopic === 'notification:new') return
            loadUnreadCount({ silent: true })
        })
        return () => { unsub(); unsub2() }
    }, [token, open, tryPlayChime, loadNotifications, loadUnreadCount])

    useEffect(() => {
        const onClick = (event) => {
            if (ref.current && !ref.current.contains(event.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') setOpen(false) }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [])

    useEffect(() => {
        if (open && window.innerWidth < 640) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    useEffect(() => { if (open) loadNotifications() }, [open, loadNotifications])

    const markOneRead = async (notification) => {
        if (!notification.isRead) {
            setNotifications((prev) => prev.map((i) => (i.id === notification.id ? { ...i, isRead: true } : i)))
            setUnread((i) => Math.max(0, i - 1))
            setProcessing(notification.id)
            try { await api.post(`/api/notifications/${notification.id}/read`) } catch { }
            finally { setProcessing(null) }
        }
        if (notification.link) {
            setOpen(false)
            navigate(notification.link)
        }
    }

    const markAllRead = async () => {
        try {
            await api.post('/api/notifications/read-all')
            setNotifications((prev) => prev.map((i) => ({ ...i, isRead: true })))
            setUnread(0)
        } catch { }
    }

    // 🔧 FIX: Navigate to the correct dashboard's notifications page based on user role
    const viewAllNotifications = () => {
        setOpen(false)
        const basePath = user ? dashboards[user.role] || '/' : '/'
        navigate(`${basePath}/notifications`)
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length
    const recentNotifications = notifications.slice(0, 4)

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                <AnimatePresence>
                    {unread > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900"
                        >
                            {unread > 9 ? '9+' : unread}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm sm:hidden"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="
                                fixed inset-x-3 top-20 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900
                                sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[380px]
                            "
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/30">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                                        >
                                            <CheckCheck className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Mark all read</span>
                                        </button>
                                    )}
                                    <button onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden">
                                        <CloseIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
                                {loading ? (
                                    <div className="space-y-3 p-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="animate-pulse space-y-2">
                                                <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                                                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                                            </div>
                                        ))}
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-4 py-12 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                            <Bell className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">No notifications</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">You're all caught up.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {recentNotifications.map((n) => {
                                            const isUnread = !n.isRead
                                            const isProcessing = processing === n.id

                                            return (
                                                <li
                                                    key={n.id}
                                                    onClick={() => markOneRead(n)}
                                                    className={`relative cursor-pointer px-4 py-3 transition-colors ${
                                                        isUnread
                                                            ? 'bg-brand-50/30 hover:bg-brand-50/70 dark:bg-brand-950/10 dark:hover:bg-brand-950/30'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    }`}
                                                >
                                                    {isUnread && <div className="absolute left-0 top-0 h-full w-1 bg-brand-600" />}
                                                    <div className="flex items-start gap-3 pl-1">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className={`truncate ${isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-300'} text-sm`}>
                                                                    {n.title}
                                                                </p>
                                                                {!isUnread && <CheckCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                                                            </div>
                                                            <p className={`mt-0.5 line-clamp-2 text-xs ${isUnread ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                {n.message}
                                                            </p>
                                                            <p className="mt-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                                                {formatTimeAgo(n.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <button
                                    onClick={viewAllNotifications}
                                    className="flex w-full items-center justify-center gap-2 py-3 text-xs font-bold text-brand-600 transition-colors hover:bg-slate-100 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-slate-800"
                                >
                                    View all notifications
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}