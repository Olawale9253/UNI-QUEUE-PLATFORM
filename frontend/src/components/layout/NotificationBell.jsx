import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { formatTimeAgo } from '../../lib/format'
import { playAttentionSound } from '../../lib/soundService'
import { usePrefsStore } from '../../store/prefsStore'
import { syncBus } from '../../lib/syncBus'

const SOUND_DEBOUNCE_MS = 1200

export default function NotificationBell() {
    const { token } = useAuthStore()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [unread, setUnread] = useState(0)
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(null)
    const ref = useRef(null)

    // Debounce: prevent a burst of SSE events (broadcast to a group) from
    // chiming many times in a row.
    const lastSoundAtRef = useRef(0)

    const tryPlayChime = useCallback(() => {
        const soundOn = usePrefsStore.getState().prefs.soundEnabled !== false
        if (!soundOn) return
        const now = Date.now()
        if (now - lastSoundAtRef.current < SOUND_DEBOUNCE_MS) return
        lastSoundAtRef.current = now
        try {
            playAttentionSound()
        } catch {
            // AudioContext not unlocked yet — silent failure is fine
        }
    }, [])

    const loadUnreadCount = useCallback(
        async (opts = {}) => {
            if (!token) return
            try {
                const res = await api.get('/api/notifications/unread/count')
                const next = res.data.data?.count ?? 0
                setUnread((prev) => {
                    // Fallback path: if for some reason SSE didn't fire, still
                    // chime on count increase — but ONLY if the caller didn't
                    // already handle the sound.
                    if (next > prev && !opts.silent) {
                        tryPlayChime()
                    }
                    return next
                })
            } catch {
                // silent
            }
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

    // Initial fetch + slow safety-net poll (10 min instead of 30s, since SSE
    // is now the primary channel).
    useEffect(() => {
        loadUnreadCount()
        const interval = setInterval(() => loadUnreadCount({ silent: true }), 600000)
        return () => clearInterval(interval)
    }, [loadUnreadCount])

    // ═══ SSE bridge: react to live notification events ═══
    useEffect(() => {
        if (!token) return undefined

        const unsub = syncBus.subscribe('notification:new', () => {
            // 1. Immediately chime — the event itself is the signal.
            tryPlayChime()
            // 2. Bump the badge without waiting for a poll.
            setUnread((prev) => prev + 1)
            // 3. If the panel is open, refetch so the new item appears live.
            if (open) loadNotifications()
        })

        // Also listen on `data-changed` — some flows may not emit the
        // specific topic, but the broad one is always published by the SSE
        // hook. Refetch the count so nothing is missed.
        const unsub2 = syncBus.subscribe('data-changed', (payload) => {
            if (payload?.source === 'sse' && payload?.serverTopic === 'notification:new') {
                // Already handled above — avoid double handling
                return
            }
            // Silent refresh — don't chime here; the specific handler did.
            loadUnreadCount({ silent: true })
        })

        return () => {
            unsub()
            unsub2()
        }
    }, [token, open, tryPlayChime, loadNotifications, loadUnreadCount])

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

    // Lock body scroll on mobile when open
    useEffect(() => {
        if (open && window.innerWidth < 640) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [open])

    // Refetch the list whenever the panel opens
    useEffect(() => {
        if (open) loadNotifications()
    }, [open, loadNotifications])

    const markOneRead = async (notification) => {
        if (!notification.isRead) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
            )
            setUnread((v) => Math.max(0, v - 1))
            setProcessing(notification.id)
            try {
                await api.post(`/api/notifications/${notification.id}/read`)
            } catch {
                // next poll resyncs
            } finally {
                setProcessing(null)
            }
        }

        if (notification.link) {
            setOpen(false)
            navigate(notification.link)
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
                className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
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
                                fixed inset-x-3 top-20 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900
                                sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[420px] sm:rounded-lg sm:shadow-lg
                            "
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                                        >
                                            <CheckCheck className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Mark all read</span>
                                            <span className="sm:hidden">All</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:hidden dark:hover:bg-slate-800"
                                        aria-label="Close"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto sm:max-h-[500px]">
                                {loading ? (
                                    <div className="space-y-3 p-4">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className="animate-pulse space-y-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
                                            >
                                                <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                                                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                                                <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                                            </div>
                                        ))}
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-4 py-12 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                            <Bell className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            No notifications
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            You're all caught up.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {notifications.slice(0, 30).map((n) => {
                                            const isUnread = !n.isRead
                                            const isProcessing = processing === n.id

                                            return (
                                                <li
                                                    key={n.id}
                                                    onClick={() => markOneRead(n)}
                                                    className={`relative cursor-pointer px-4 py-3 transition-colors ${
                                                        isUnread
                                                            ? 'bg-brand-50/40 hover:bg-brand-50/70 dark:bg-brand-950/20 dark:hover:bg-brand-950/30'
                                                            : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                                                    }`}
                                                >
                                                    {isUnread && (
                                                        <motion.div
                                                            layoutId={`unread-bar-${n.id}`}
                                                            className="absolute left-0 top-0 h-full w-1 bg-brand-600"
                                                        />
                                                    )}

                                                    <div className="flex items-start gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex min-w-0 items-center gap-2">
                                                                    {isUnread && (
                                                                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                                                                    )}
                                                                    <p
                                                                        className={`truncate ${
                                                                            isUnread
                                                                                ? 'text-sm font-semibold text-slate-900 dark:text-slate-100'
                                                                                : 'text-sm font-medium text-slate-700 dark:text-slate-300'
                                                                        }`}
                                                                    >
                                                                        {n.title}
                                                                    </p>
                                                                </div>

                                                                {isUnread ? (
                                                                    isProcessing ? (
                                                                        <div className="shrink-0 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
                                                                            <Check className="h-3.5 w-3.5 text-slate-400" />
                                                                        </div>
                                                                    ) : null
                                                                ) : (
                                                                    <CheckCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                                )}
                                                            </div>

                                                            <p
                                                                className={`mt-1 whitespace-pre-wrap text-xs leading-relaxed ${
                                                                    isUnread
                                                                        ? 'text-slate-700 dark:text-slate-300'
                                                                        : 'text-slate-500 dark:text-slate-400'
                                                                }`}
                                                            >
                                                                {n.message}
                                                            </p>

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

                            {notifications.length > 0 && (
                                <div className="border-t border-slate-100 px-4 py-2 text-center dark:border-slate-800">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
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