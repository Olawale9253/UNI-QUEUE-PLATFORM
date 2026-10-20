import { useState, useEffect } from 'react'
import { Bell, CheckCircle2, Info, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'

export default function NotificationsPage() {
    const { push } = useToastStore()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        let cancelled = false
        api.get('/api/user/notifications')
            .then(res => {
                if (!cancelled) setNotifications(res.data?.data || [])
            })
            .catch(err => {
                if (cancelled) return
                const message = err.message || 'Failed to load notifications'
                setLoadError(message)
                push({ type: 'error', message })
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [push])

    const loadNotifications = async () => {
        setLoading(true)
        setLoadError('')
        try {
            const res = await api.get('/api/user/notifications')
            setNotifications(res.data?.data || [])
        } catch (err) {
            const message = err.message || 'Failed to load notifications'
            setLoadError(message)
            push({ type: 'error', message })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-900/50 dark:bg-slate-900">
                <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
                <h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Couldn’t load notifications
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{loadError}</p>
                <button
                    type="button"
                    onClick={loadNotifications}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </button>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <Bell className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">All caught up!</p>
                            <p className="text-xs mt-1">You have no new notifications.</p>
                        </div>
                    ) : (
                        notifications.map(n => {
                            const type = n.type?.toLowerCase() || 'info'
                            const Icon = type === 'success' ? CheckCircle2 : type === 'warning' ? AlertTriangle : type === 'info' ? Info : Bell
                            const color = type === 'success' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : type === 'warning' ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'text-brand-500 bg-brand-50 dark:bg-brand-950/30'

                            return (
                                <div key={n.id} className={`flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.isRead ? 'bg-brand-50/30 dark:bg-brand-950/10' : ''}`}>
                                    <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${!n.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                            {n.title || 'Notification'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">{n.message}</p>
                                    </div>
                                    <div className="text-xs text-slate-400 whitespace-nowrap">
                                        {new Date(n.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}