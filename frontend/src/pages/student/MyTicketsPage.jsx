import { useState, useEffect } from 'react'
import { Ticket, LogOut, CheckCircle2 } from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'

export default function MyTicketsPage() {
    const { push } = useToastStore()
    const [activeTicket, setActiveTicket] = useState(null)
    const [history, setHistory] = useState([])

    useEffect(() => {
        api.get('/api/user/tickets/active')
            .then(res => setActiveTicket(res.data?.data || null))
            .catch(() => {})

        api.get('/api/user/tickets/history')
            .then(res => setHistory(res.data?.data || []))
            .catch(err => push({ type: 'error', message: err.message }))
    }, [push])

    const leaveQueue = async () => {
        if (!activeTicket) return
        try {
            await api.post(`/api/user/tickets/${activeTicket.id}/leave`)
            setActiveTicket(null)
            push({ type: 'success', message: 'You have left the queue' })
        } catch (err) {
            push({ type: 'error', message: err.message })
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Queue Position</h1>

            {activeTicket ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40">
                                <Ticket className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeTicket.queueName}</h2>
                                <p className="text-xs text-slate-500">Ticket #{activeTicket.ticketNumber}</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Active</span>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <p className="text-xs font-semibold text-slate-500">Your Position</p>
                            <p className="mt-1 text-4xl font-bold text-slate-900 dark:text-white">{activeTicket.position || 1}</p>
                            <p className="text-xs text-slate-400">in queue</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500">Estimated Wait Time</p>
                            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">~ {activeTicket.estimatedMinutes || 10} min</p>
                            <div className="mt-2 flex gap-4 text-xs text-slate-500">
                                <span>People Ahead: <strong>{Math.max(0, (activeTicket.position || 1) - 1)}</strong></span>
                            </div>
                        </div>
                        <div className="flex items-center justify-end">
                            <button onClick={leaveQueue} className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                                <LogOut className="h-4 w-4" /> Leave Queue
                            </button>
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="relative flex items-center justify-between">
                            <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="absolute left-0 top-1/2 h-0.5 w-1/3 -translate-y-1/2 bg-brand-600"></div>

                            {['Joined', 'Waiting', 'In Service', 'Completed'].map((step, idx) => (
                                <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-900 ${idx <= 1 ? 'border-brand-600 text-brand-600' : 'border-slate-300 text-slate-300 dark:border-slate-700 dark:text-slate-700'}`}>
                                        {idx <= 1 && <CheckCircle2 className="h-3.5 w-3.5" />}
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
                    <Ticket className="mx-auto h-10 w-10 text-slate-400" />
                    <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">No active ticket</h3>
                    <p className="text-xs text-slate-500 mt-1">Join a queue to see your live position here.</p>
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Ticket History</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.filter(t => t.status !== 'WAITING').map(ticket => (
                        <div key={ticket.id} className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{ticket.queueName}</p>
                                <p className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="text-xs font-medium text-slate-500 uppercase">{ticket.status}</span>
                        </div>
                    ))}
                    {history.length === 0 && <p className="py-4 text-sm text-slate-500">No history yet.</p>}
                </div>
            </div>
        </div>
    )
}