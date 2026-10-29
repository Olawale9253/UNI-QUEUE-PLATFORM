import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Search, ChevronRight, HelpCircle, GraduationCap,
    Users, Building2, Banknote, Clock, MapPin, Phone,
    ArrowRight, CheckCircle2,
    FileText, BookOpen, Monitor, ListOrdered, Info, Lock
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { withAlpha } from '../../lib/colors'

function inferCategory(queueName, officeName) {
    const name = `${queueName} ${officeName}`.toLowerCase()
    if (name.includes('bursary') || name.includes('finance') || name.includes('fee') || name.includes('payment') || name.includes('tuition')) return 'Financial'
    if (name.includes('register') || name.includes('transcript') || name.includes('result') || name.includes('exam') || name.includes('academic') || name.includes('clearance')) return 'Academic'
    if (name.includes('student') || name.includes('welfare') || name.includes('counsel') || name.includes('library') || name.includes('hostel')) return 'Student Support'
    if (name.includes('ict') || name.includes('computer') || name.includes('portal')) return 'Administrative'
    return 'Other'
}

function getCategoryIcon(category, name) {
    const n = (name || '').toLowerCase()
    if (n.includes('register')) return FileText
    if (n.includes('transcript')) return BookOpen
    if (n.includes('library')) return BookOpen
    if (n.includes('ict') || n.includes('computer')) return Monitor

    switch (category) {
        case 'Academic': return GraduationCap
        case 'Financial': return Banknote
        case 'Student Support': return Users
        case 'Administrative': return Building2
        default: return ListOrdered
    }
}

const CATEGORIES = ['All Queues', 'Academic', 'Administrative', 'Student Support', 'Financial', 'Other']

export default function QueuesTab() {
    const { push } = useToastStore()
    const { user } = useAuthStore()
    const { university } = useUniversityStore()
    const navigate = useNavigate()

    const [queues, setQueues] = useState([])
    const [offices, setOffices] = useState([])
    const [activeTicket, setActiveTicket] = useState(null)
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('All Queues')
    const [selectedQueueId, setSelectedQueueId] = useState(null)
    const [joining, setJoining] = useState(false)

    const primaryColor = university?.primaryColor || '#4f46e5'
    const isFresher = user?.role === 'FRESHER'

    const load = useCallback(async () => {
        try {
            const [queueRes, tokenRes, officeRes] = await Promise.all([
                api.get('/api/queues').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/tickets/active').catch(() => ({ data: { data: null } })),
                api.get('/api/offices').catch(() => ({ data: { data: [] } }))
            ])
            const fetchedQueues = queueRes.data?.data || []
            const fetchedOffices = officeRes.data?.data || []

            setQueues(fetchedQueues)
            setOffices(fetchedOffices)
            setActiveTicket(tokenRes.data?.data || null)

            setSelectedQueueId(prev => {
                if (prev) return prev
                return fetchedQueues.length > 0 ? fetchedQueues[0].id : null
            })
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load queues' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    const enrichedQueues = useMemo(() => {
        return queues.map(q => ({
            ...q,
            category: inferCategory(q.name, q.officeName)
        }))
    }, [queues])

    const filteredQueues = useMemo(() => {
        let result = [...enrichedQueues]

        if (activeCategory !== 'All Queues') {
            result = result.filter(q => q.category === activeCategory)
        }

        if (search.trim()) {
            const s = search.toLowerCase()
            result = result.filter(q =>
                q.name.toLowerCase().includes(s) ||
                q.officeName?.toLowerCase().includes(s) ||
                q.description?.toLowerCase().includes(s)
            )
        }

        result.sort((a, b) => {
            if (isFresher) {
                const aLocked = a.matricRequired ? 1 : 0
                const bLocked = b.matricRequired ? 1 : 0
                if (aLocked !== bLocked) return aLocked - bLocked
            }
            return a.name.localeCompare(b.name)
        })

        return result
    }, [enrichedQueues, activeCategory, search, isFresher])

    const selectedQueue = filteredQueues.find(q => String(q.id) === String(selectedQueueId))

    const selectedOffice = useMemo(() => {
        if (!selectedQueue) return null
        return offices.find(o =>
            (o.id && selectedQueue.officeId && String(o.id) === String(selectedQueue.officeId)) ||
            o.name === selectedQueue.officeName
        )
    }, [selectedQueue, offices])

    const handleJoinQueue = async (queueToJoin) => {
        if (activeTicket) {
            push({ type: 'error', message: 'You already have an active ticket. Complete it before joining another queue.' })
            return
        }
        if (!queueToJoin.isOpen) {
            push({ type: 'error', message: 'This queue is currently closed.' })
            return
        }
        if (isFresher && queueToJoin.matricRequired) {
            push({ type: 'error', message: 'You must update your profile with a matric number to join this queue.' })
            return
        }

        setJoining(true)
        try {
            await api.post('/api/user/tickets/join', { queueId: queueToJoin.id })
            push({ type: 'success', message: `Successfully joined ${queueToJoin.name}!` })
            navigate('/student/my-tickets')
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to join queue' })
        } finally {
            setJoining(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center bg-white dark:bg-slate-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-950 min-h-screen -m-4 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8">
            <div className="max-w-[1600px] mx-auto pb-12">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Browse Queues</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                            View available queues across different offices and join the one you need. Get your place in line, save time and avoid unnecessary waiting.
                        </p>
                    </div>

                    <div
                        className="hidden md:flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors bg-white dark:bg-slate-900 dark:border-slate-800"
                        style={{ borderColor: withAlpha(primaryColor, 0.3), boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
                        onClick={() => push({ type: 'info', message: 'Check queue rules and FAQs at support@uniqueue.com' })}
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}>
                            <HelpCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Need help?</div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Check queue rules and FAQs.</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 ml-2" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-6">
                    {CATEGORIES.map(cat => {
                        const isActive = activeCategory === cat
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all border ${
                                    isActive
                                        ? 'text-white shadow-sm border-transparent'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                                style={isActive ? { backgroundColor: primaryColor } : undefined}
                            >
                                {cat === 'All Queues' && <ListOrdered className="h-4 w-4" />}
                                {cat === 'Academic' && <GraduationCap className="h-4 w-4" />}
                                {cat === 'Administrative' && <Building2 className="h-4 w-4" />}
                                {cat === 'Student Support' && <Users className="h-4 w-4" />}
                                {cat === 'Financial' && <Banknote className="h-4 w-4" />}
                                {cat === 'Other' && <Clock className="h-4 w-4" />}
                                {cat}
                            </button>
                        )
                    })}
                </div>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by queue name, office or service..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                style={{ '--tw-ring-color': withAlpha(primaryColor, 0.2) }}
                            />
                        </div>

                        {filteredQueues.length === 0 ? (
                            <EmptyState icon={Search} title="No queues found" description="Try adjusting your search or category filter." />
                        ) : (
                            <div className="space-y-3">
                                {filteredQueues.map(queue => {
                                    const isSelected = String(selectedQueueId) === String(queue.id)
                                    const Icon = getCategoryIcon(queue.category, queue.name)
                                    const isOpen = queue.isOpen === true
                                    const isLocked = isFresher && queue.matricRequired
                                    const isDisabled = !isOpen || isLocked

                                    return (
                                        <div
                                            key={queue.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedQueueId(queue.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault()
                                                    setSelectedQueueId(queue.id)
                                                }
                                            }}
                                            className={`w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl transition-all duration-200 border-2 bg-white dark:bg-slate-900 cursor-pointer focus:outline-none focus-visible:ring-2 ${
                                                isSelected
                                                    ? 'shadow-md'
                                                    : 'border-slate-100 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                                            }`}
                                            style={isSelected ? { borderColor: primaryColor } : undefined}
                                        >
                                            <div className="flex items-start gap-4 flex-1">
                                                <div
                                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                                                    style={{
                                                        backgroundColor: isSelected ? withAlpha(primaryColor, 0.15) : '#f1f5f9',
                                                        color: isSelected ? primaryColor : '#64748b'
                                                    }}
                                                >
                                                    <Icon className="h-6 w-6" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{queue.name}</h3>
                                                        <Badge variant="default" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                            {queue.category}
                                                        </Badge>
                                                        <Badge variant={isOpen ? 'success' : 'danger'} className="flex items-center gap-1">
                                                            {isOpen && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                            {isOpen ? 'Open' : 'Closed'}
                                                        </Badge>
                                                        {isLocked && (
                                                            <Badge variant="warning" className="flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                                                <Lock className="h-3 w-3" />
                                                                Matric Required
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                                                        {queue.description || 'No description provided.'}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {queue.estimatedMinutes || 0} mins (est.)
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Users className="h-3.5 w-3.5" />
                                                            {queue.waitingCount || 0} people ahead
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex items-center justify-end sm:pl-4 sm:border-l sm:border-slate-100 dark:sm:border-slate-800 mt-4 sm:mt-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (!isSelected) {
                                                            setSelectedQueueId(queue.id)
                                                        } else if (!isDisabled) {
                                                            handleJoinQueue(queue)
                                                        }
                                                    }}
                                                    disabled={isDisabled || joining}
                                                    className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition-all disabled:cursor-not-allowed ${
                                                        isDisabled
                                                            ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                                            : 'text-white hover:shadow-md'
                                                    }`}
                                                    style={!isDisabled ? { backgroundColor: primaryColor } : undefined}
                                                >
                                                    {isLocked ? (
                                                        <>
                                                            <Lock className="h-4 w-4" /> Update Profile
                                                        </>
                                                    ) : !isOpen ? (
                                                        'Closed'
                                                    ) : (
                                                        <>
                                                            Join Queue <ArrowRight className="h-4 w-4" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="sticky top-24">
                        {selectedQueue ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={selectedQueue.id}>
                                <Card
                                    padded={false}
                                    className="overflow-hidden shadow-lg border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900"
                                >
                                    {/* 👇 SOLID COLOR HEADER WITH DOT PATTERN */}
                                    <div
                                        className="p-6 relative overflow-hidden text-white"
                                        style={{
                                            backgroundColor: primaryColor,
                                            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
                                            backgroundSize: '16px 16px'
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />

                                        <div className="flex items-start justify-between gap-4 relative z-10">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner text-white">
                                                    {(() => { const Icon = getCategoryIcon(selectedQueue.category, selectedQueue.name); return <Icon className="h-8 w-8" /> })()}
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-md">
                                                        {selectedQueue.name}
                                                    </h2>
                                                    <p className="mt-1 text-sm font-medium text-white/80">
                                                        {selectedQueue.officeName || 'University Office'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 shrink-0 backdrop-blur-sm">
                                                {selectedQueue.category}
                                            </Badge>
                                        </div>
                                        <p className="mt-4 text-sm text-white/90 relative z-10 max-w-md">
                                            {selectedQueue.description || 'Join this queue to get served.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 dark:divide-slate-800 dark:border-slate-800 bg-white dark:bg-slate-900">
                                        <div className="p-4 text-center">
                                            <div className="flex justify-center mb-1 text-slate-400"><Clock className="h-4 w-4" /></div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedQueue.estimatedMinutes || 0} mins</div>
                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Est. Wait</div>
                                        </div>
                                        <div className="p-4 text-center">
                                            <div className="flex justify-center mb-1 text-slate-400"><Users className="h-4 w-4" /></div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedQueue.waitingCount || 0}</div>
                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ahead</div>
                                        </div>
                                        <div className="p-4 text-center">
                                            <div className="flex justify-center mb-1 text-slate-400"><CheckCircle2 className="h-4 w-4" /></div>
                                            <Badge variant={selectedQueue.isOpen ? 'success' : 'danger'} className="text-xs">
                                                {selectedQueue.isOpen ? 'Open' : 'Closed'}
                                            </Badge>
                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Status</div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-5">
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</div>
                                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                        {selectedOffice?.location || selectedQueue.location || 'Main Administrative Building'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Working Hours</div>
                                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                        {selectedQueue.workingHours || 'Mon – Fri: 8:00 AM – 4:00 PM'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact</div>
                                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                        {selectedOffice?.phone || selectedQueue.phone || 'Not assigned'}
                                                    </div>
                                                    {(selectedOffice?.email || selectedQueue.email) && (
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {selectedOffice?.email || selectedQueue.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Services Included</h4>
                                            <ul className="space-y-2">
                                                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    {selectedQueue.name} processing
                                                </li>
                                                {selectedQueue.description && (
                                                    <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                                        {selectedQueue.description}
                                                    </li>
                                                )}
                                                {selectedOffice?.name && (
                                                    <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                                        Managed by {selectedOffice.name}
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                        {isFresher && selectedQueue.matricRequired ? (
                                            <button
                                                type="button"
                                                onClick={() => navigate('/student/profile')}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 shadow-sm transition-all hover:bg-amber-100 border border-amber-200"
                                            >
                                                <Lock className="h-4 w-4" />
                                                Update Profile to Join
                                            </button>
                                        ) : !selectedQueue.isOpen ? (
                                            <button
                                                type="button"
                                                disabled
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                                            >
                                                Queue is Closed
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleJoinQueue(selectedQueue)}
                                                disabled={joining || !!activeTicket}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                <Users className="h-4 w-4" />
                                                {activeTicket ? 'Already in a Queue' : joining ? 'Joining...' : 'Join Queue'}
                                                {!activeTicket && !joining && <ChevronRight className="h-4 w-4" />}
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => navigate('/student/offices')}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <Building2 className="h-4 w-4" />
                                            View Office Details
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="p-4 text-center border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/student/my-tickets')}
                                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                        >
                                            Already in the queue? <span style={{ color: primaryColor }} className="underline">View My Queues</span>
                                        </button>
                                    </div>

                                </Card>
                            </motion.div>
                        ) : (
                            <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl">
                                <EmptyState
                                    icon={Info}
                                    variant="info"
                                    size="lg"
                                    bordered={false}
                                    title="Select a queue"
                                    description="Pick a queue from the list to see its details and join."
                                />
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}