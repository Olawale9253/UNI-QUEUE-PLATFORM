import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    CheckCircle2, Circle, Loader2, AlertTriangle, ArrowRight, ArrowLeft,
    MapPin, CalendarDays, RefreshCw, PartyPopper, Route, XCircle
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToastStore } from '../../store/toastStore'

function ProgressHeader({ data, onCancel, cancelling }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-brand-500" />
                        <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {data.workflowName}
                        </h1>
                    </div>
                    {data.session && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <CalendarDays className="h-3 w-3" />
                            Session {data.session}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {data.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <PartyPopper className="h-3 w-3" />
                            Completed
                        </span>
                    )}
                    {data.status === 'IN_PROGRESS' && (
                        <button
                            onClick={onCancel}
                            disabled={cancelling}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60"
                        >
                            {cancelling ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <XCircle className="h-3.5 w-3.5" />
                            )}
                            Cancel Workflow
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                        <strong className="text-slate-700 dark:text-slate-300">{data.completedSteps}</strong>
                        {' '}of{' '}
                        <strong className="text-slate-700 dark:text-slate-300">{data.totalSteps}</strong>
                        {' '}steps complete
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {data.progressPercent}%
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.progressPercent}%` }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                    />
                </div>
            </div>
        </div>
    )
}

function NextActionCard({ action }) {
    if (!action) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border-2 border-brand-300 bg-gradient-to-br from-brand-50 to-white p-5 dark:border-brand-700 dark:from-brand-950/40 dark:to-slate-900"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                        Next step
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {action.label || action.queueName}
                    </div>
                    {action.officeName && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3 w-3" />
                            {action.officeName}
                        </div>
                    )}
                </div>

                {action.queueId && (
                    <Link
                        to={`/student/queues/${action.queueId}`}
                        className="shrink-0 self-center rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                    >
                        Go to queue
                    </Link>
                )}
            </div>
        </motion.div>
    )
}

const STEP_ICONS = {
    COMPLETED: CheckCircle2,
    IN_PROGRESS: Loader2,
    PENDING: Circle,
    SKIPPED: Circle,
}

const STEP_STYLES = {
    COMPLETED: {
        dot: 'bg-emerald-500',
        line: 'bg-emerald-500',
        title: 'text-slate-900 dark:text-slate-100',
        badge: null,
    },
    IN_PROGRESS: {
        dot: 'bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-900/60',
        line: 'bg-slate-200 dark:bg-slate-700',
        title: 'text-slate-900 dark:text-slate-100 font-semibold',
        badge: {
            text: 'In progress',
            cls: 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300',
        },
    },
    PENDING: {
        dot: 'bg-slate-300 dark:bg-slate-600',
        line: 'bg-slate-200 dark:bg-slate-700',
        title: 'text-slate-500 dark:text-slate-400',
        badge: null,
    },
    SKIPPED: {
        dot: 'bg-slate-300',
        line: 'bg-slate-200 dark:bg-slate-700',
        title: 'text-slate-400 line-through',
        badge: {
            text: 'Skipped',
            cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        },
    },
}

function relativeTime(iso) {
    if (!iso) return null
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.round(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.round(hrs / 24)
    return `${days}d ago`
}

function StepRow({ step, isLast }) {
    const styles = STEP_STYLES[step.status] ?? STEP_STYLES.PENDING
    const Icon = STEP_ICONS[step.status] ?? Circle

    const iconColor =
        step.status === 'COMPLETED'
            ? 'text-white'
            : step.status === 'IN_PROGRESS'
                ? 'text-white animate-spin'
                : 'text-slate-500 dark:text-slate-300'

    return (
        <div className="relative flex gap-3">
            <div className="flex flex-col items-center">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.dot}`}
                >
                    <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2.4} />
                </div>
                {!isLast && <div className={`mt-1 w-0.5 flex-1 ${styles.line}`} />}
            </div>

            <div className={`min-w-0 flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Step {step.order}
                            </span>
                            {styles.badge && (
                                <span
                                    className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${styles.badge.cls}`}
                                >
                                    {styles.badge.text}
                                </span>
                            )}
                        </div>
                        <div className={`mt-0.5 text-sm ${styles.title}`}>
                            {step.label || step.queueName}
                        </div>
                        {step.officeName && (
                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                                <MapPin className="h-2.5 w-2.5" />
                                {step.officeName}
                            </div>
                        )}
                    </div>

                    {step.status === 'COMPLETED' && step.completedAt && (
                        <div className="shrink-0 text-[10px] font-medium text-slate-400">
                            {relativeTime(step.completedAt)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function Skeleton() {
    return (
        <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
    )
}

function EmptyState({ message }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Route className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                No active clearance
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {message}
            </p>
            <Link
                to="/student/workflows"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
                Browse workflows
                <ArrowRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    )
}

export default function StudentWorkflowProgress() {
    const navigate = useNavigate()
    const { push } = useToastStore()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [cancelling, setCancelling] = useState(false)

    const load = async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        setError(null)
        try {
            const res = await api.get('/api/student/workflows/my-progress')
            setData(res.data.data)
        } catch (err) {
            const status = err.response?.status
            const msg = err.message
            if (status === 404) setError('NONE')
            else setError(msg || 'Failed to load progress')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const handleCancelWorkflow = async () => {
        if (!data?.enrollmentId) return
        setCancelling(true)
        try {
            await api.post(`/api/user/workflows/${data.enrollmentId}/abandon`)
            push({ type: 'success', message: 'Workflow cancelled successfully.' })
            setShowCancelConfirm(false)
            navigate('/student/workflows')
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to cancel workflow' })
        } finally {
            setCancelling(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4 pb-12">
                <Skeleton />
            </div>
        )
    }

    if (error === 'NONE') {
        return (
            <div className="space-y-4 pb-12">
                <EmptyState message="You are not enrolled in a clearance workflow yet." />
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-4 pb-12">
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/20">
                    <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
                    <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
                        {error}
                    </p>
                    <button
                        onClick={() => load()}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Try again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-12">
            <Link
                to="/student/workflows"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
            >
                <ArrowLeft className="h-3 w-3" />
                Browse all workflows
            </Link>

            <ProgressHeader
                data={data}
                onCancel={() => setShowCancelConfirm(true)}
                cancelling={cancelling}
            />

            <NextActionCard action={data.nextAction} />

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Your steps
                    </h2>
                    <button
                        onClick={() => load(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <RefreshCw
                            className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </button>
                </div>

                <div className="space-y-0">
                    {data.steps.map((step, index) => (
                        <StepRow
                            key={step.order}
                            step={step}
                            isLast={index === data.steps.length - 1}
                        />
                    ))}
                </div>
            </div>

            <ConfirmDialog
                open={showCancelConfirm}
                onClose={() => !cancelling && setShowCancelConfirm(false)}
                onConfirm={handleCancelWorkflow}
                title="Cancel this workflow?"
                description="Are you sure you want to stop this workflow? You will lose your current progress, and you will be removed from any active queues related to it."
                confirmLabel="Yes, cancel workflow"
                variant="danger"
                loading={cancelling}
            />
        </div>
    )
}