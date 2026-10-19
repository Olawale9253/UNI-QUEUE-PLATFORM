import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, Ticket } from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'

export default function JoinQueuePage() {
    const { push } = useToastStore()
    const navigate = useNavigate()
    const [queues, setQueues] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(null)

    useEffect(() => {
        api.get('/api/queues')
            .then(res => setQueues(res.data?.data || []))
            .catch(err => push({ type: 'error', message: err.message }))
            .finally(() => setLoading(false))
    }, [push])

    const filtered = queues.filter(q =>
        q.name.toLowerCase().includes(search.toLowerCase()) ||
        q.officeName?.toLowerCase().includes(search.toLowerCase())
    )

    const joinQueue = async (id) => {
        setJoining(id)
        try {
            const res = await api.post('/api/user/tickets/join', { queueId: id })
            push({ type: 'success', message: `Ticket generated: ${res.data.data.ticketNumber}` })
            // Redirect to My Tickets page after joining
            navigate('/student/my-tickets')
        } catch (err) {
            push({ type: 'error', message: err.message })
        } finally {
            setJoining(null)
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Join a Queue</h1>
                <p className="text-sm text-slate-500">Select the service you need and join the queue.</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search for a service..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1,2,3,4].map(i => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {filtered.map(queue => (
                        <div key={queue.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{queue.name}</h3>
                            <p className="mt-1 flex-1 text-xs text-slate-500 line-clamp-2">
                                {queue.description || 'No description provided'}
                            </p>
                            <button
                                onClick={() => joinQueue(queue.id)}
                                disabled={queue.isOpen !== true || joining === queue.id}
                                className="mt-4 flex w-full items-center justify-center rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                            >
                                {joining === queue.id ? 'Joining...' : queue.isOpen ? 'Join Queue' : 'Closed'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}