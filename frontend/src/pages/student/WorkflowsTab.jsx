import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Route as RouteIcon, CheckCircle2, Lock, ArrowRight, Play, X as CloseIcon, ListChecks, Sparkles,
    GraduationCap, FileText, Banknote, Building2, ClipboardCheck, Monitor, Clock,
    HelpCircle, Lightbulb, ChevronRight, Activity, Calendar
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

// 👇 Helper to assign dynamic icons based on workflow name
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

function WorkflowsSkeleton() {
    return (
        <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
        </div>
    )
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
            push({ type: 'success', message: 'Workflow started' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to start' })
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

    // Calculate stats
    const stats = useMemo(() => {
        const completed = mine.filter(w => w.status === 'COMPLETED').length
        const inProgress = mine.filter(w => w.status === 'IN_PROGRESS').length
        const pending = available.length
        const total = completed + inProgress + pending
        return { total, completed, inProgress, pending }
    }, [mine, available])

    // Merge all workflows for the list view
    const allWorkflows = useMemo(() => {
        const started = mine.map(w => ({
            ...w,
            isStarted: true,
            progress: w.totalSteps > 0 ? Math.round((w.completedSteps / w.totalSteps) * 100) : 0,
        }))
        const notStarted = available.map(w => ({
            ...w,
            isStarted: false,
            progress: 0,
            status: 'PENDING'
        }))
        return [...started, ...notStarted]
    }, [mine, available])

    // Generate latest updates (just combining completed workflows and available ones for demo purposes)
    const latestUpdates = useMemo(() => {
        const completedUpdates = mine.filter(w => w.status === 'COMPLETED').map(w => ({
            id: w.id, title: `${w.workflowName} Completed`, desc: `Your ${w.workflowName.toLowerCase()} has been confirmed.`,
            date: w.completedAt, type: 'success', icon: CheckCircle2
        }))
        const progressUpdates = mine.filter(w => w.status === 'IN_PROGRESS').map(w => ({
            id: w.id, title: `${w.workflowName} In Progress`, desc: `You are currently on step ${w.currentStepOrder}.`,
            date: w.joinedAt, type: 'progress', icon: Activity
        }))
        const pendingUpdates = available.slice(0, 2).map(w => ({
            id: w.id, title: `${w.name} Open`, desc: `This workflow is now available.`,
            date: new Date().toISOString(), type: 'pending', icon: Calendar
        }))

        return [...completedUpdates, ...progressUpdates, ...pendingUpdates]
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 4)
    }, [mine, available])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <WorkflowsSkeleton />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header & Help Box */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Student Workflows
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                        Track, manage and complete your university processes — all in one place. Follow each step, meet the requirements, and get updates as you progress.
                    </p>
                </div>
                <div
                    className="hidden md:flex items-start gap-3 rounded-xl border px-4 py-3 max-w-xs cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                        backgroundColor: withAlpha(primaryColor, 0.05),
                        borderColor: withAlpha(primaryColor, 0.2)
                    }}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-800" style={{ color: primaryColor }}>
                        <Lightbulb className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Need help with a process?</div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Check the FAQ section or contact support.</div>
                        <div className="text-xs font-bold mt-2 flex items-center gap-1" style={{ color: primaryColor }}>
                            View Help & FAQs <ChevronRight className="h-3 w-3" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="flex items-center gap-4 p-5 bg-blue-50/30 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        <RouteIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Total Workflows</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                        <p className="text-[11px] text-slate-400">Active processes</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 p-5 bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Completed</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
                        <p className="text-[11px] text-slate-400">Finished successfully</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 p-5 bg-amber-50/30 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">In Progress</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inProgress}</p>
                        <p className="text-[11px] text-slate-400">Still ongoing</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 p-5 bg-purple-50/30 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Pending</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
                        <p className="text-[11px] text-slate-400">Awaiting action</p>
                    </div>
                </Card>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

                {/* LEFT: My Workflows List */}
                <div className="space-y-4">
                    <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Workflows</h2>
                                <p className="text-xs text-slate-500">Your current university processes and their status.</p>
                            </div>
                            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                All Statuses
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {allWorkflows.length === 0 ? (
                                <div className="p-8 text-center">
                                    <EmptyState icon={Sparkles} title="No workflows available" description="Check back later when your university adds new processes." />
                                </div>
                            ) : (
                                allWorkflows.map((item) => {
                                    const Icon = getWorkflowIcon(item.workflowName || item.name);
                                    const title = item.workflowName || item.name;
                                    const isPending = item.status === 'PENDING';
                                    const isCompleted = item.status === 'COMPLETED';
                                    const isInProgress = item.status === 'IN_PROGRESS';

                                    return (
                                        <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
                                                        <Badge variant={isCompleted ? 'success' : isInProgress ? 'warning' : 'default'}>
                                                            {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description || `Process for ${title.toLowerCase()}`}</p>

                                                    {/* Progress Bar */}
                                                    <div className="flex items-center gap-3 mt-3">
                                                        <div className="h-1.5 w-full max-w-xs bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                                                            <div
                                                                className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                                style={{ width: `${item.progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">{item.progress}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:items-end gap-2 shrink-0 sm:w-32">
                                                <span className="text-[10px] text-slate-400">Last updated: {formatDateTime(item.completedAt || item.joinedAt) || '—'}</span>
                                                <div className="flex items-center gap-2">
                                                    {isInProgress && (
                                                        <button onClick={() => setAbandonTarget(item)} className="text-slate-400 hover:text-rose-500 transition-colors" title="Abandon">
                                                            <XIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => isPending ? start(item.id) : navigate('/student/clearance')}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
                                                    >
                                                        {isPending ? 'Start' : 'View Details'}
                                                    </button>
                                                </div>
                                            </div>
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
                    <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">Workflow Quick Actions</h3>
                        </div>
                        <div className="p-3 space-y-1">
                            {available.slice(0, 4).map(w => {
                                const Icon = getWorkflowIcon(w.name);
                                return (
                                    <button
                                        key={w.id}
                                        onClick={() => start(w.id)}
                                        disabled={starting === w.id}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{w.name}</p>
                                            <p className="text-[11px] text-slate-500 truncate">{w.description || 'Start process'}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                                    </button>
                                )
                            })}
                        </div>
                    </Card>

                    {/* Latest Updates */}
                    <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">Latest Updates</h3>
                            <button className="text-xs font-semibold text-blue-600 hover:underline">View All</button>
                        </div>
                        <div className="p-4 space-y-4">
                            {latestUpdates.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-4">No recent updates.</p>
                            ) : (
                                latestUpdates.map((update, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="relative mt-1">
                                            <div className={`flex h-6 w-6 items-center justify-center rounded-full z-10 relative ${update.type === 'success' ? 'bg-emerald-100 text-emerald-600' : update.type === 'progress' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                                <update.icon className="h-3 w-3" />
                                            </div>
                                            {i !== latestUpdates.length - 1 && <div className="absolute top-6 left-1/2 -translate-x-1/2 w-px h-full bg-slate-200 dark:bg-slate-700" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{update.title}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{update.desc}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(update.date)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* How it works */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">How It Works</h4>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {[
                        { step: '1', title: 'Start the process', desc: 'Choose the service you need from the workflows list.', icon: Play },
                        { step: '2', title: 'Complete requirements', desc: 'Submit the necessary documents and information.', icon: CheckCircle2 },
                        { step: '3', title: 'Track progress', desc: 'Check your status and get real-time updates.', icon: Activity },
                        { step: '4', title: 'Get notified', desc: 'Receive alerts when your process is updated.', icon: Bell },
                        { step: '5', title: 'Done!', desc: 'Your request is completed and ready for use.', icon: Star },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700">
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Step {item.step}</p>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                                <p className="text-[10px] text-slate-500 max-w-[150px] leading-tight mt-0.5">{item.desc}</p>
                            </div>
                            {i < 4 && <ChevronRight className="hidden md:block h-4 w-4 text-slate-300 ml-auto" />}
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmDialog
                open={!!abandonTarget}
                onClose={() => !abandoning && setAbandonTarget(null)}
                onConfirm={abandon}
                title={`Abandon "${abandonTarget?.workflowName || abandonTarget?.name}"?`}
                description="You'll lose your progress on this workflow. You can restart it later, but you'll begin from step 1."
                confirmLabel="Abandon"
                cancelLabel="Keep going"
                variant="danger"
                loading={abandoning}
            />
        </div>
    )
}