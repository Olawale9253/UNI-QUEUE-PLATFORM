import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Route as RouteIcon,
    CheckCircle2,
    Lock,
    ArrowRight,
    Play,
    X,
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

export default function WorkflowsTab() {
    const { push } = useToastStore()
    const [mine, setMine] = useState([])
    const [available, setAvailable] = useState([])
    const [loading, setLoading] = useState(true)
    const [starting, setStarting] = useState(null)
    const [abandonTarget, setAbandonTarget] = useState(null)
    const [abandoning, setAbandoning] = useState(false)

    const load = useCallback(async () => {
        try {
            const [m, a] = await Promise.all([
                api.get('/api/user/workflows'),
                api.get('/api/user/workflows/available'),
            ])
            setMine(m.data.data || [])
            setAvailable(a.data.data || [])
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

    const startedIds = new Set(mine.map((m) => m.workflowId))
    const notStarted = available.filter((w) => !startedIds.has(w.id))

    const inProgress = mine.filter((m) => m.status === 'IN_PROGRESS')
    const completed = mine.filter((m) => m.status === 'COMPLETED')
    const abandoned = mine.filter((m) => m.status === 'ABANDONED')

    if (loading) {
        return (
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        )
    }

    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    Clearance Workflows
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Multi-step clearance chains. Complete each step in order — you can only join
                    the current step's queue.
                </p>
            </div>

            {inProgress.length > 0 && (
                <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        In progress
                    </h3>
                    <motion.div
                        variants={stagger(0, 0.05)}
                        initial="initial"
                        animate="animate"
                        className="space-y-4"
                    >
                        {inProgress.map((w) => (
                            <motion.div key={w.id} variants={staggerItem}>
                                <WorkflowProgressCard
                                    workflow={w}
                                    onAbandon={() => setAbandonTarget(w)}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </section>
            )}

            {notStarted.length > 0 && (
                <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Available workflows
                    </h3>
                    <motion.div
                        variants={stagger(0, 0.05)}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-1 gap-4 md:grid-cols-2"
                    >
                        {notStarted.map((w) => (
                            <motion.div key={w.id} variants={staggerItem}>
                                <Card className="flex h-full flex-col">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <RouteIcon className="h-4 w-4 text-brand-600" />
                                                <h4 className="text-base font-semibold text-slate-900">
                                                    {w.name}
                                                </h4>
                                            </div>
                                            {w.session && (
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    Session {w.session}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant="default">{w.stepCount} steps</Badge>
                                    </div>

                                    {w.description && (
                                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                                            {w.description}
                                        </p>
                                    )}

                                    <ol className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
                                        {w.steps.map((s, idx) => (
                                            <li
                                                key={s.order}
                                                className="flex items-center gap-2 text-xs text-slate-600"
                                            >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {idx + 1}
                        </span>
                                                <span className="truncate">{s.label || s.queueName}</span>
                                            </li>
                                        ))}
                                    </ol>

                                    <div className="mt-auto pt-5">
                                        <Button
                                            fullWidth
                                            icon={Play}
                                            onClick={() => start(w.id)}
                                            loading={starting === w.id}
                                            disabled={starting === w.id}
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

            {completed.length > 0 && (
                <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Completed
                    </h3>
                    <Card padded={false}>
                        <ul className="divide-y divide-slate-100">
                            {completed.map((w) => (
                                <li
                                    key={w.id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-6 py-3"
                                >
                                    <div>
                    <span className="text-sm font-medium text-slate-900">
                      {w.workflowName}
                    </span>
                                        <span className="ml-2 text-xs text-slate-500">
                      · {formatDateTime(w.completedAt)}
                    </span>
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

            {abandoned.length > 0 && (
                <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Abandoned
                    </h3>
                    <Card padded={false}>
                        <ul className="divide-y divide-slate-100">
                            {abandoned.map((w) => (
                                <li
                                    key={w.id}
                                    className="flex items-center justify-between px-6 py-3 text-sm text-slate-600"
                                >
                                    <span>{w.workflowName}</span>
                                    <Badge variant="default">Abandoned</Badge>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </section>
            )}

            {mine.length === 0 && notStarted.length === 0 && (
                <EmptyState
                    icon={RouteIcon}
                    title="No workflows available"
                    description="Your university hasn't published any clearance workflows yet."
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

function WorkflowProgressCard({ workflow, onAbandon }) {
    const {
        name,
        session,
        steps,
        currentStepOrder,
        completedSteps,
        totalSteps,
        currentQueueName,
    } = workflow

    return (
        <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <RouteIcon className="h-4 w-4 text-brand-600" />
                        <h4 className="text-base font-semibold text-slate-900">{name}</h4>
                    </div>
                    {session && <p className="mt-0.5 text-xs text-slate-500">Session {session}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="warning">In progress</Badge>
                    <button
                        onClick={onAbandon}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Abandon workflow"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>
            Step {currentStepOrder} of {totalSteps}
          </span>
                    <span>
            {completedSteps}/{totalSteps} complete
          </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-brand-600"
                    />
                </div>
            </div>

            {currentQueueName && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
            <strong>Next step:</strong> join the <strong>{currentQueueName}</strong> queue
            to continue.
          </span>
                </div>
            )}

            <ol className="mt-5 space-y-2">
                {steps.map((s) => (
                    <li key={s.order} className="flex items-start gap-3">
                        <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                s.state === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : s.state === 'CURRENT'
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                            {s.state === 'COMPLETED' ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : s.state === 'CURRENT' ? (
                                s.order
                            ) : (
                                <Lock className="h-3 w-3" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div
                                className={`text-sm ${
                                    s.state === 'LOCKED' ? 'text-slate-400' : 'font-medium text-slate-900'
                                }`}
                            >
                                {s.queueName}
                                {s.label && (
                                    <span className="ml-2 text-xs font-normal text-slate-500">
                    · {s.label}
                  </span>
                                )}
                            </div>
                            {s.state === 'CURRENT' && (
                                <p className="mt-0.5 text-xs font-medium text-brand-600">
                                    ← You are here
                                </p>
                            )}
                        </div>
                        {s.state === 'CURRENT' && (
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700">
                Current
              </span>
                        )}
                    </li>
                ))}
            </ol>
        </Card>
    )
}