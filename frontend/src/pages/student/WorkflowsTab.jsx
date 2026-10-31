import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Route as RouteIcon, CheckCircle2, Lock, ArrowRight, Play, X as CloseIcon, ListChecks, Sparkles,
    GraduationCap, FileText, Banknote, Building2, ClipboardCheck, Monitor, Clock,
    HelpCircle, Lightbulb, ChevronRight, Activity, Calendar, Bell, Star, Zap, Info, RotateCcw
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useUniversityStore } from '../../store/universityStore'
import { formatDateTime } from '../../lib/format'
import { withAlpha } from '../../lib/colors'

// Helper to assign dynamic icons based on workflow name
function getWorkflowIcon(name = '') {
    const n = name.toLowerCase()
    if (n.includes('course') || n.includes('registration') || n.includes('academic')) return GraduationCap
    if (n.includes('transcript') || n.includes('document') || n.includes('result')) return FileText
    if (n.includes('bursary') || n.includes('payment') || n.includes('fee')) return Banknote
    if (n.includes('hostel') || n.includes('accommodation')) return Building2
    if (n.includes('clearance') || n.includes('progress')) return ClipboardCheck
    if (n.includes('it ') || n.includes('portal') || n.includes('support')) return Monitor
    return RouteIcon
}

export default function WorkflowsTab() {
    const { push } = useToastStore()
    const { university } = useUniversityStore()
    const navigate = useNavigate()

    const [mine, setMine] = useState([])
    const [available, setAvailable] = useState([])
    const [loading, setLoading] = useState(true)
    const [starting, setStarting] = useState(null)
    const [abandonTarget, setAbandonTarget] = useState(null)
    const [abandoning, setAbandoning] = useState(false)

    const [statusFilter, setStatusFilter] = useState('ALL')

    const primaryColor = university?.primaryColor || '#4f46e5'

    const load = useCallback(async () => {
        try {
            const [resMine, resAvailable] = await Promise.all([
                api.get('/api/user/workflows').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/workflows/available').catch(() => ({ data: { data: [] } })),
            ])
            setMine(resMine.data.data || [])
            setAvailable(resAvailable.data.data || [])
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const start = async (workflowId) => {
        setStarting(workflowId)
        try {
            await api.post(`/api/user/workflows/${workflowId}/start`)
            push({ type: 'success', message: 'Workflow started successfully' })
            await load()
            navigate('/student/clearance')
        } catch (err) {
            if (err.response?.data?.message?.includes('already started')) {
                push({ type: 'info', message: 'You already have an active session for this. Redirecting...' })
                navigate('/student/clearance')
            } else {
                push({ type: 'error', message: err.message || 'Failed to start' })
            }
        } finally {
            setStarting(null)
        }
    }

    const abandon = async () => {
        if (!abandonTarget) return
        setAbandoning(true)
        try {
            await api.post(`/api/user/workflows/${abandonTarget.id}/abandon`)
            push({ type: 'success', message: 'Workflow abandoned' })
            setAbandonTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to abandon' })
        } finally {
            setAbandoning(false)
        }
    }

    const stats = useMemo(() => {
        const completed = mine.filter(w => w.status === 'COMPLETED').length
        const inProgress = mine.filter(w => w.status === 'IN_PROGRESS').length
        const pending = available.length
        const total = completed + inProgress + pending
        return { total, completed, inProgress, pending }
    }, [mine, available])

    const allWorkflows = useMemo(() => {
        const map = new Map()
        mine.forEach(w => {
            map.set(w.workflowId, {
                id: w.workflowId,
                enrollmentId: w.id,
                name: w.workflowName,
                description: w.description || 'University process',
                status: w.status,
                progress: w.totalSteps > 0 ? Math.round((w.completedSteps / w.totalSteps) * 100) : 0,
                steps: w.steps || [],
                joinedAt: w.joinedAt,
                completedAt: w.completedAt,
                isStarted: true
            })
        })
        available.forEach(w => {
            if (!map.has(w.id)) {
                map.set(w.id, {
                    id: w.id,
                    name: w.name,
                    description: w.description || 'University process',
                    status: 'PENDING',
                    progress: 0,
                    steps: w.steps || [],
                    isStarted: false
                })
            }
        })
        return Array.from(map.values())
    }, [mine, available])

    const filteredWorkflows = useMemo(() => {
        if (statusFilter === 'ALL') return allWorkflows
        return allWorkflows.filter(w => w.status === statusFilter)
    }, [allWorkflows, statusFilter])

    const latestUpdates = useMemo(() => {
        const completedUpdates = mine.filter(w => w.status === 'COMPLETED').map(w => ({
            id: w.id, title: `${w.workflowName} Completed`, desc: `Your ${w.workflowName.toLowerCase()} has been confirmed.`,
            date: w.completedAt, type: 'success'
        }))
        const progressUpdates = mine.filter(w => w.status === 'IN_PROGRESS').map(w => ({
            id: w.id, title: `${w.workflowName} In Progress`, desc: `You are currently on step ${w.currentStepOrder}.`,
            date: w.joinedAt, type: 'progress'
        }))
        const pendingUpdates = available.slice(0, 2).map(w => ({
            id: w.id, title: `${w.name} Open`, desc: `This workflow is now available.`,
            date: new Date().toISOString(), type: 'pending'
        }))

        return [...completedUpdates, ...progressUpdates, ...pendingUpdates]
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 4)
    }, [mine, available])

    if (loading) {
        return (
            <div className="space-y-6 p-4">
                <div className="h-8 w-1/2 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="grid grid-cols-2 gap-3">
                    <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12 px-4 sm:px-6">
            {/* Header */}
            <div className="pt-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Student Workflows
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Track, manage and complete your university processes. Follow each step and get updates as you progress.
                </p>
            </div>

            {/* Stats Row - Now 2x2 on mobile, 4x1 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-4 bg-blue-50/40 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        <RouteIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{stats.total}</p>
                    </div>
                </Card>
                <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-4 bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Completed</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{stats.completed}</p>
                    </div>
                </Card>
                <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-4 bg-amber-50/40 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">In Progress</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{stats.inProgress}</p>
                    </div>
                </Card>
                <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-4 bg-purple-50/40 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Pending</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{stats.pending}</p>
                    </div>
                </Card>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

                {/* LEFT: All Workflows List */}
                <div className="space-y-4">
                    <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 gap-3">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">All Workflows</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Select a process to view its steps.</p>
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-sm w-full sm:w-auto"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Available</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredWorkflows.length === 0 ? (
                                <div className="p-8 text-center">
                                    <EmptyState icon={Sparkles} title="No workflows" description="You have no workflows with this status." />
                                </div>
                            ) : (
                                filteredWorkflows.map((item) => {
                                    const Icon = getWorkflowIcon(item.name);
                                    const isPending = item.status === 'PENDING';
                                    const isCompleted = item.status === 'COMPLETED';
                                    const isInProgress = item.status === 'IN_PROGRESS';
                                    const isAbandoned = item.status === 'ABANDONED';

                                    return (
                                        <div key={item.id} className="p-4 sm:p-5 flex flex-col gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">{item.name}</h3>
                                                            <Badge variant={isCompleted ? 'success' : isInProgress ? 'warning' : isAbandoned ? 'danger' : 'default'} className="shadow-sm text-[10px]">
                                                                {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : isAbandoned ? 'Abandoned' : 'Available'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                                                    {isInProgress && (
                                                        <button onClick={() => setAbandonTarget(item)} className="text-slate-400 hover:text-rose-500 transition-colors p-2" title="Abandon">
                                                            <CloseIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {isCompleted ? (
                                                        <Button variant="secondary" onClick={() => navigate('/student/clearance')} className="text-xs h-8 px-3">Details</Button>
                                                    ) : isInProgress ? (
                                                        <Button onClick={() => navigate('/student/clearance')} className="text-xs h-8 px-3" style={{ backgroundColor: primaryColor }}>Continue</Button>
                                                    ) : (
                                                        <Button
                                                            onClick={() => start(item.id)}
                                                            loading={starting === item.id}
                                                            className="text-xs h-8 px-3"
                                                            style={{ backgroundColor: primaryColor }}
                                                            icon={isAbandoned ? RotateCcw : Play}
                                                        >
                                                            {isAbandoned ? 'Restart' : 'Start'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Step-by-Step Preview */}
                                            {item.steps && item.steps.length > 0 && (
                                                <div className="sm:ml-13 mt-2">
                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                        {item.steps.map((step, idx) => (
                                                            <div key={idx} className="flex items-center gap-1 sm:gap-2">
                                                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] font-bold text-slate-500 dark:bg-slate-900">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="truncate max-w-[80px] sm:max-w-none">{step.queueName || step.label || 'Step'}</span>
                                                                </div>
                                                                {idx < item.steps.length - 1 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Progress Bar */}
                                            {isInProgress && (
                                                <div className="sm:ml-13 mt-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-1.5 w-full max-w-xs bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                                                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${item.progress}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0">{item.progress}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </Card>
                </div>

                {/* RIGHT: Quick Actions & Latest Updates */}
                <div className="space-y-6">

                    {/* Quick Actions */}
                    <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                                <Zap className="h-4 w-4" style={{ color: primaryColor }} /> Quick Actions
                            </h3>
                        </div>
                        <div className="p-3 space-y-2">
                            {available.slice(0, 4).map(w => {
                                const Icon = getWorkflowIcon(w.name);
                                const startedVersion = allWorkflows.find(x => x.id === w.id && x.status !== 'PENDING')
                                const isStarted = !!startedVersion

                                return (
                                    <button
                                        key={w.id}
                                        onClick={() => isStarted ? navigate('/student/clearance') : start(w.id)}
                                        disabled={starting === w.id}
                                        className="w-full group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-200 bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-800 transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-slate-800 transition-colors">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors truncate">{w.name}</p>
                                                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{isStarted ? 'Continue process' : 'Start process'}</p>
                                            </div>
                                        </div>
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 group-hover:bg-brand-100 dark:bg-slate-800 transition-colors ml-2">
                                            <Play className="h-3 w-3 text-slate-400 group-hover:text-brand-600 transition-colors fill-current" />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </Card>

                    {/* Latest Updates */}
                    <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Latest Updates</h3>
                        </div>
                        <div className="p-4 sm:p-5">
                            {latestUpdates.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-4">No recent updates.</p>
                            ) : (
                                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                    {latestUpdates.map((update, i) => {
                                        let dotColor = 'bg-amber-500';
                                        if (update.type === 'success') dotColor = 'bg-emerald-500';
                                        if (update.type === 'progress') dotColor = 'bg-blue-500';

                                        return (
                                            <div key={i} className="relative flex items-start gap-3 pb-5 last:pb-0 group">
                                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-900 shadow-sm z-10 relative mt-1`}>
                                                    <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{update.title}</p>
                                                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-2">{update.desc}</p>
                                                    <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-1.5 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {formatDateTime(update.date)}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* How it Works - Compacted for Mobile */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 sm:p-8 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-20" />
                <h4 className="text-center text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 sm:mb-8">How It Works</h4>

                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-4 overflow-x-auto pb-4 md:pb-0">
                    <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />

                    {[
                        { step: '1', title: 'Start', desc: 'Choose the service you need.', icon: Play },
                        { step: '2', title: 'Complete', desc: 'Submit the necessary documents.', icon: CheckCircle2 },
                        { step: '3', title: 'Track', desc: 'Check your status in real-time.', icon: Activity },
                        { step: '4', title: 'Get Notified', desc: 'Receive alerts when updated.', icon: Bell },
                        { step: '5', title: 'Done!', desc: 'Your request is completed.', icon: Star },
                    ].map((item, i) => (
                        <div key={i} className="relative z-10 flex md:flex-col items-center md:text-center w-full md:w-1/5 group gap-4 md:gap-0 shrink-0">
                            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white border-2 border-slate-100 text-slate-400 shadow-sm group-hover:border-brand-200 group-hover:text-brand-600 group-hover:shadow-md transition-all duration-300 dark:bg-slate-900 dark:border-slate-800 shrink-0">
                                <item.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="text-left md:text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase md:mt-4 md:mb-1">Step {item.step}</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                                <p className="text-xs text-slate-500 md:mt-1 max-w-[200px] md:max-w-[120px] leading-tight">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmDialog
                open={!!abandonTarget}
                onClose={() => !abandoning && setAbandonTarget(null)}
                onConfirm={abandon}
                title={`Abandon "${abandonTarget?.name}"?`}
                description="You'll lose your progress on this workflow. You can restart it later, but you'll begin from step 1."
                confirmLabel="Abandon"
                cancelLabel="Keep going"
                variant="danger"
                loading={abandoning}
            />
        </div>
    )
}