import { useState, useEffect } from 'react'
import { Bell, CheckCircle2, Info, AlertTriangle, Loader2 } from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'

export default function NotificationsPage() {
    const { push } = useToastStore()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/api/user/notifications')
            .then(res => setNotifications(res.data?.data || []))
            .catch(err => push({ type: 'error', message: err.message }))
            .finally(() => setLoading(false))
    }, [push])

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
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