import { Bell, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

const MOCK_NOTIFICATIONS = [
    { id: 1, type: 'success', title: 'Your queue position has been updated', desc: 'You are now 5th in the queue for Library.', time: '10:32 AM', read: false },
    { id: 2, type: 'info', title: 'Queue completed', desc: 'Your hostel queue (Ticket #HST-2026-0021) has been completed. Please proceed.', time: 'Yesterday', read: true },
    { id: 3, type: 'warning', title: 'New announcement', desc: 'The Bursary office will be closed tomorrow (Thu, 16 Oct).', time: 'Yesterday', read: true },
    { id: 4, type: 'primary', title: 'Queue reminder', desc: 'You have a ticket in the Exam queue. Please be ready.', time: '2 days ago', read: true },
]

export default function NotificationsPage() {
    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
                <button className="text-sm font-semibold text-brand-600 hover:text-brand-700">Mark all as read</button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {MOCK_NOTIFICATIONS.map(n => {
                        const Icon = n.type === 'success' ? CheckCircle2 : n.type === 'warning' ? AlertTriangle : n.type === 'info' ? Info : Bell
                        const color = n.type === 'success' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : n.type === 'warning' ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'text-brand-500 bg-brand-50 dark:bg-brand-950/30'

                        return (
                            <div key={n.id} className={`flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.read ? 'bg-brand-50/30 dark:bg-brand-950/10' : ''}`}>
                                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                        {n.title}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">{n.desc}</p>
                                </div>
                                <div className="text-xs text-slate-400 whitespace-nowrap">{n.time}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}