import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Building2, Ticket, ArrowRight } from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { stagger, staggerItem } from '../../lib/motion'

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
            navigate('/student/my-tickets')
        } catch (err) {
            push({ type: 'error', message: err.message })
        } finally {
            setJoining(null)
        }
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header & Search Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Join a Service
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Select the service you need and join the queue.
                    </p>
                </div>
                <div className="w-full max-w-sm">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search for a service..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-44 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No services found"
                    description={search ? "Try a different search term." : "No services available right now."}
                    action={search ? <button onClick={() => setSearch('')} className="text-brand-600 font-semibold">Clear search</button> : undefined}
                />
            ) : (
                <motion.div
                    variants={stagger(0, 0.05)}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {filtered.map(queue => (
                        <motion.div key={queue.id} variants={staggerItem} className="h-full">
                            <Card className="flex h-full flex-col justify-between">
                                <div>
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <Badge variant={queue.isOpen ? 'success' : 'default'}>
                                            {queue.isOpen ? 'Live' : 'Closed'}
                                        </Badge>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{queue.name}</h3>
                                    <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                                        {queue.description || 'No description provided'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => joinQueue(queue.id)}
                                    disabled={!queue.isOpen || joining === queue.id}
                                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                                        queue.isOpen
                                            ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                                    }`}
                                >
                                    {joining === queue.id ? 'Joining...' : queue.isOpen ? 'Join Queue' : 'Closed'}
                                    {queue.isOpen && joining !== queue.id && <ArrowRight className="h-4 w-4" />}
                                </button>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}