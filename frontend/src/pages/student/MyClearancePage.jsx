import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft, CheckCircle2, Lock, ArrowRight, Clock, MapPin,
    User, Calendar, Loader2, AlertCircle, Sparkles, Ticket,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { useToastStore } from '../../store/toastStore'

function formatDate(iso) {
    if (!iso) return null
    try {
        const dateValue = new Date(iso)
        return dateValue.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return null }
}

function formatTime(iso) {
    if (!iso) return null
    try {
        const dateValue = new Date(iso)
        return dateValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch { return null }
}

function ClearanceStepper({ steps, currentOrder }) {
    return (
        <div className="relative mb-6 sm:mb-8 overflow-x-auto pb-4 custom-scrollbar">
            <div className="relative min-w-[500px]">
                {/* The connecting line behind the circles */}
                <div className="absolute left-6 right-6 top-4 sm:top-5 -z-0 h-0.5 bg-slate-200 dark:bg-slate-700" />

                <div className="relative z-10 flex items-start justify-between gap-1">
                    {steps.map((step) => {
                        const isDone = step.state === 'COMPLETED'
                        const isCurrent = step.state === 'CURRENT'
                        return (
                            <div key={step.order} className="flex min-w-0 flex-1 flex-col items-center">
                                <div
                                    className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border-2 font-bold transition-all ${
                                        isDone
                                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                            : isCurrent
                                                ? 'border-brand-600 bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-950/40'
                                                : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900'
                                    }`}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    ) : isCurrent ? (
                                        step.order
                                    ) : (
                                        <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    )}
                                </div>

                                <div className="mt-2 w-full px-1 text-center">
                                    <div
                                        className={`truncate text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide ${
                                            isDone
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : isCurrent
                                                    ? 'text-brand-600 dark:text-brand-400'
                                                    : 'text-slate-400 dark:text-slate-600'
                                        }`}
                                    >
                                        {step.label || step.queueName}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function StepCard({ step, onJoinQueue, isJoining }) {
    const isDone = step.state === 'COMPLETED'
    const isCurrent = step.state === 'CURRENT'
    const isLocked = step.state === 'LOCKED'

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: step.order * 0.05 }}
            className={`relative rounded-xl border p-3 sm:p-5 transition-all ${
                isDone
                    ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20'
                    : isCurrent
                        ? 'border-brand-300 bg-gradient-to-br from-brand-50/60 to-white shadow-md ring-1 ring-brand-200 dark:border-brand-800 dark:from-brand-950/30 dark:to-slate-900 dark:ring-brand-900'
                        : 'border-slate-200 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-900/50'
            }`}
        >
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ${
                        isDone
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : isCurrent
                                ? 'bg-brand-600 text-white shadow-sm'
                                : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                    }`}
                >
                    {isDone ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : isCurrent ? (
                        <span className="font-bold text-sm sm:text-base">{step.order}</span>
                    ) : (
                        <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                </div>

                <div className="min-w-0 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                            {step.label || step.queueName}
                        </h3>
                        {isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-white">
                                <Sparkles className="h-2.5 w-2.5" /> Current
                            </span>
                        )}
                        {isDone && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                Complete
                            </span>
                        )}
                    </div>

                    {step.queueName && step.label && step.queueName !== step.label && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3 w-3" /> {step.queueName}
                        </div>
                    )}

                    {step.instructions && (
                        <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-sm text-slate-600 dark:text-slate-400">
                            {step.instructions}
                        </p>
                    )}

                    {isDone && step.completedAt && (
                        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-[9px] sm:text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" /> {formatDate(step.completedAt)} · {formatTime(step.completedAt)}
                            </span>
                            {step.completedByName && (
                                <span className="flex items-center gap-1.5">
                                    <User className="h-3 w-3" /> {step.completedByName}
                                </span>
                            )}
                        </div>
                    )}

                    {isCurrent && (
                        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onJoinQueue(step)}
                                disabled={isJoining}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                            >
                                {isJoining ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Joining…</>
                                ) : (
                                    <><Ticket className="h-4 w-4" /> Join Queue</>
                                )}
                            </button>
                        </div>
                    )}

                    {isLocked && (
                        <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-xs italic text-slate-400 dark:text-slate-600">
                            Unlocks after Step {step.order - 1}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

export default function MyClearancePage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { push } = useToastStore()
    const [progress, setProgress] = useState(null)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)

    const load = useCallback(async () => {
        try {
            const res = await api.get(`/api/user/workflows/${id}/progress`)
            setProgress(res.data.data)
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load clearance' })
        } finally {
            setLoading(false)
        }
    }, [id, push])

    useEffect(() => { load() }, [load])

    const joinCurrentStep = async () => {
        if (!progress?.currentQueueId) return
        setJoining(true)
        try {
            const res = await api.post('/api/user/tickets/join', { queueId: progress.currentQueueId })
            push({ type: 'success', message: `Joined. Ticket: ${res.data.data.ticketNumber}` })
            navigate('/student/queues')
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to join queue' })
        } finally {
            setJoining(false)
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6">
                <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
        )
    }

    if (!progress) {
        return (
            <div className="px-4 sm:px-6">
                <EmptyState icon={AlertCircle} title="Clearance not found" description="This workflow could not be loaded." action={<Button onClick={() => navigate('/student/workflows')} className="w-full sm:w-auto">Back to workflows</Button>} />
            </div>
        )
    }

    const pct = progress.totalSteps > 0 ? Math.round((progress.completedSteps / progress.totalSteps) * 100) : 0

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <button onClick={() => navigate('/student/workflows')} className="mb-4 sm:mb-5 -ml-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                <ArrowLeft className="h-4 w-4" /> Back to clearances
            </button>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="mb-4 sm:mb-6 p-4 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{progress.workflowName}</h1>
                            {progress.description && <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">{progress.description}</p>}
                            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs text-slate-500 dark:text-slate-400">
                                {progress.session && <span className="rounded-full bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 font-medium dark:bg-slate-800">Session {progress.session}</span>}
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 font-medium dark:bg-slate-800">{progress.completedSteps} of {progress.totalSteps} complete</span>
                                {progress.status === 'COMPLETED' ? <Badge variant="success" className="text-[9px] sm:text-xs">Completed</Badge> : progress.status === 'ABANDONED' ? <Badge variant="default" className="text-[9px] sm:text-xs">Abandoned</Badge> : <Badge variant="warning" className="text-[9px] sm:text-xs">In progress</Badge>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <div className="mb-1.5 flex items-center justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                            <span>Progress</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{pct}%</span>
                        </div>
                        <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600" />
                        </div>
                    </div>
                </Card>
            </motion.div>

            <Card className="mb-4 sm:mb-6 p-4 sm:p-6">
                <ClearanceStepper steps={progress.steps} currentOrder={progress.currentStepOrder} />
            </Card>

            <div className="space-y-2 sm:space-y-3">
                {progress.steps.map((step) => (
                    <StepCard key={step.order} step={step} onJoinQueue={joinCurrentStep} isJoining={joining} />
                ))}
            </div>

            {progress.status === 'COMPLETED' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-semibold text-emerald-900 dark:text-emerald-300">All clear! 🎉</h3>
                        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-emerald-800 dark:text-emerald-400">You've completed every step of {progress.workflowName}. Download your clearance slip from your documents.</p>
                    </div>
                </motion.div>
            )}
        </div>
    )
}