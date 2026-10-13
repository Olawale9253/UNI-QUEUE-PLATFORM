import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Route as RouteIcon,
    CheckCircle2,
    Lock,
    ArrowRight,
    Play,
    X as CloseIcon,
    ListChecks,
    Sparkles,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../lib/format'
import { stagger, staggerItem } from '../../lib/motion'

const statusVariant = {
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    ABANDONED: 'default',
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton — mirrors the two stacked cards                   */
/* ------------------------------------------------------------------ */

function WorkflowsSkeleton() {
    return (
        <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function WorkflowsTab() {
    const { push } = useToastStore()
    const navigate = useNavigate()
    const [mine, setMine] = useState([])
    const [available, setAvailable] = useState([])
    const [loading, setLoading] = useState(true)
    const [starting, setStarting] = useState(null)
    const [abandonTarget, setAbandonTarget] = useState(null)
    const [abandoning, setAbandoning] = useState(false)

    const load = useCallback(async () => {
        try {
            const [message, firstValue] = await Promise.all([
                api.get('/api/user/workflows'),
                api.get('/api/user/workflows/available'),
            ])
            setMine(message.data.data || [])
            setAvailable(firstValue.data.data || [])
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const start = async (workflowId) => {
        setStarting(workflowId)
        try {
            await api.post(`/api/user/workflows/${workflowId}/start`)
            push({ type: 'success', message: 'Workflow started' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to start' })
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
            push({ type: 'error', message: err.response?.data?.message || 'Failed to abandon' })
        } finally {
            setAbandoning(false)
        }
    }

    const startedIds = new Set(mine.map((item) => item.workflowId))
    const notStarted = available.filter((itemValue) => !startedIds.has(itemValue.id))

    const inProgress = mine.filter((itemValue2) => itemValue2.status === 'IN_PROGRESS')
    const completed = mine.filter((itemValue3) => itemValue3.status === 'COMPLETED')
    const abandoned = mine.filter((itemValue4) => itemValue4.status === 'ABANDONED')

    if (loading) {
        return (
            <div>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        Clearance Workflows
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Multi-step clearance chains. Complete each step in order.
                    </p>
                </div>
                <WorkflowsSkeleton />
            </div>
        )
    }

    const isCompletelyEmpty = mine.length === 0 && notStarted.length === 0

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Clearance Workflows
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Multi-step clearance chains. Complete each step in order — you can only join
                    the current step's queue.
                </p>
            </div>

            {/* ═══ In progress ═══ */}
            {inProgress.length > 0 && (
                <section>
                    <SectionHeading
                        label="In progress"
                        count={inProgress.length}
                        tone="brand"
                    />
                    <motion.div
                        variants={stagger(0, 0.05)}
                        initial="initial"
                        animate="animate"
                        className="space-y-4"
                    >
                        {inProgress.map((itemValue5) => (
                            <motion.div key={itemValue5.id} variants={staggerItem}>
                                <WorkflowProgressCard
                                    workflow={itemValue5}
                                    onAbandon={() => setAbandonTarget(itemValue5)}
                                    onContinue={() => navigate('/student/clearance')}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </section>
            )}

            {/* ═══ Available ═══ */}
            {notStarted.length > 0 && (
                <section>
                    <SectionHeading
                        label="Available workflows"
                        count={notStarted.length}
                    />
                    <motion.div
                        variants={stagger(0, 0.05)}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-1 gap-4 md:grid-cols-2"
                    >
                        {notStarted.map((workflow) => (
                            <motion.div key={workflow.id} variants={staggerItem}>
                                <Card className="flex h-full flex-col">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <RouteIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                                                <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    {workflow.name}
                                                </h4>
                                            </div>
                                            {workflow.session && (
                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                    Session {workflow.session}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant="default">
                                            <ListChecks className="h-3 w-3" />
                                            {workflow.stepCount} steps
                                        </Badge>
                                    </div>

                                    {workflow.description && (
                                        <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                                            {workflow.description}
                                        </p>
                                    )}

                                    <ol className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                                        {workflow.steps.map((itemValue6, idx) => (
                                            <li
                                                key={itemValue6.order}
                                                className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
                                            >
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    {idx + 1}
                                                </span>
                                                <span className="truncate">
                                                    {itemValue6.label || itemValue6.queueName}
                                                </span>
                                            </li>
                                        ))}
                                    </ol>

                                    <div className="mt-auto pt-5">
                                        <Button
                                            fullWidth
                                            icon={Play}
                                            onClick={() => start(workflow.id)}
                                            loading={starting === workflow.id}
                                            disabled={starting === workflow.id}
                                        >
                                            Start workflow
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>
            )}

            {/* ═══ Completed ═══ */}
            {completed.length > 0 && (
                <section>
                    <SectionHeading
                        label="Completed"
                        count={completed.length}
                        tone="success"
                    />
                    <Card padded={false}>
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {completed.map((workflowValue) => (
                                <li
                                    key={workflowValue.id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-6 py-3.5"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {workflowValue.workflowName}
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Completed {formatDateTime(workflowValue.completedAt)}
                                        </div>
                                    </div>
                                    <Badge variant="success">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Completed
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </section>
            )}

            {/* ═══ Abandoned ═══ */}
            {abandoned.length > 0 && (
                <section>
                    <SectionHeading
                        label="Abandoned"
                        count={abandoned.length}
                    />
                    <Card padded={false}>
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {abandoned.map((workflowValue2) => (
                                <li
                                    key={workflowValue2.id}
                                    className="flex items-center justify-between px-6 py-3.5 text-sm text-slate-600 dark:text-slate-400"
                                >
                                    <span className="truncate">{workflowValue2.workflowName}</span>
                                    <Badge variant="default">Abandoned</Badge>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </section>
            )}

            {/* ═══ Nothing at all ═══ */}
            {isCompletelyEmpty && (
                <EmptyState
                    icon={Sparkles}
                    variant="info"
                    title="No workflows available yet"
                    description="Your university hasn't published any clearance workflows. You'll see them here as soon as they're ready."
                    action={
                        <button
                            onClick={() => navigate('/student')}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                        >
                            Back to home
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    }
                />
            )}

            <ConfirmDialog
                open={!!abandonTarget}
                onClose={() => !abandoning && setAbandonTarget(null)}
                onConfirm={abandon}
                title={`Abandon "${abandonTarget?.workflowName}"?`}
                description="You'll lose your progress on this workflow. You can restart it later, but you'll begin from step 1."
                confirmLabel="Abandon"
                cancelLabel="Keep going"
                variant="danger"
                loading={abandoning}
            />
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Section heading                                                    */
/* ------------------------------------------------------------------ */

function SectionHeading({ label, count, tone = 'neutral' }) {
    const tones = {
        neutral: 'text-slate-500 dark:text-slate-400',
        brand: 'text-brand-600 dark:text-brand-400',
        success: 'text-emerald-600 dark:text-emerald-400',
    }
    return (
        <div className="mb-3 flex items-center gap-2">
            <h3 className={`text-xs font-semibold uppercase tracking-wide ${tones[tone]}`}>
                {label}
            </h3>
            {count > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {count}
                </span>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  In-progress workflow card                                          */
/* ------------------------------------------------------------------ */

function WorkflowProgressCard({ workflow, onAbandon, onContinue }) {
    const {
        name,
        session,
        steps,
        currentStepOrder,
        completedSteps,
        totalSteps,
        currentQueueName,
    } = workflow

    const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    return (
        <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <RouteIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {name}
                        </h4>
                    </div>
                    {session && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Session {session}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="warning">In progress</Badge>
                    <button
                        onClick={onAbandon}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        aria-label="Abandon workflow"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                        Step {currentStepOrder} of {totalSteps}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {pct}% complete
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                    />
                </div>
            </div>

            {currentQueueName && (
                <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900 dark:bg-amber-950/40">
                    <div className="flex min-w-0 items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                            <strong>Next step:</strong> join the{' '}
                            <strong>{currentQueueName}</strong> queue to continue.
                        </span>
                    </div>
                    <button
                        onClick={onContinue}
                        className="shrink-0 rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-amber-700"
                    >
                        Continue
                    </button>
                </div>
            )}

            <ol className="mt-5 space-y-2">
                {steps.map((step) => (
                    <li key={step.order} className="flex items-start gap-3">
                        <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                step.state === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                    : step.state === 'CURRENT'
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                        >
                            {step.state === 'COMPLETED' ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : step.state === 'CURRENT' ? (
                                step.order
                            ) : (
                                <Lock className="h-3 w-3" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div
                                className={`text-sm ${
                                    step.state === 'LOCKED'
                                        ? 'text-slate-400 dark:text-slate-500'
                                        : 'font-medium text-slate-900 dark:text-slate-100'
                                }`}
                            >
                                {step.queueName}
                                {step.label && (
                                    <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                                        · {step.label}
                                    </span>
                                )}
                            </div>
                            {step.state === 'CURRENT' && (
                                <p className="mt-0.5 text-xs font-medium text-brand-600 dark:text-brand-400">
                                    ← You are here
                                </p>
                            )}
                        </div>
                        {step.state === 'CURRENT' && (
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                                Current
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </Card>
    )
}