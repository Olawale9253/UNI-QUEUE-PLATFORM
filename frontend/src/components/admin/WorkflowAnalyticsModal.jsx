import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Users, CheckCircle2, Clock, TrendingUp, AlertTriangle, Loader2, Award,
} from 'lucide-react'
import api from '../../api/axios'

function StatCard({ label, value, icon: Icon, accent, hint }) {
    return (
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {value}
                    </div>
                    {hint && (
                        <div className="mt-0.5 text-[10px] text-slate-400">{hint}</div>
                    )}
                </div>
                {Icon && (
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>
        </div>
    )
}

function StepRow({ step, maxCompleted }) {
    const pct = maxCompleted > 0
        ? Math.round((step.completedCount / maxCompleted) * 100)
        : 0

    return (
        <div className={`rounded-lg border p-4 transition-colors ${
            step.isBottleneck
                ? 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                : 'border-slate-200 dark:border-slate-700'
        }`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        step.isBottleneck
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                        {step.order}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {step.label || step.queueName}
                        </div>
                        {step.label && step.label !== step.queueName && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {step.queueName}
                            </div>
                        )}
                    </div>
                </div>

                {step.isBottleneck && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Bottleneck
                    </span>
                )}
            </div>

            {/* Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full ${
                        step.isBottleneck
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                            : 'bg-gradient-to-r from-brand-500 to-brand-600'
                    }`}
                />
            </div>

            {/* Stats row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <strong className="text-slate-700 dark:text-slate-300">{step.completedCount}</strong>
                    completed
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-brand-500" />
                    <strong className="text-slate-700 dark:text-slate-300">{step.currentlyOnCount}</strong>
                    currently on step
                </span>
                {step.avgHoursOnStep > 0 && (
                    <span className="flex items-center gap-1">
                        Avg <strong className="text-slate-700 dark:text-slate-300">
                            {step.avgHoursOnStep}h
                        </strong> per student
                    </span>
                )}
            </div>
        </div>
    )
}

export default function WorkflowAnalyticsModal({ workflowId, onClose }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        api.get(`/api/admin/workflows/${workflowId}/analytics`)
            .then((res) => {
                if (!cancelled) setData(res.data.data)
            })
            .catch((err) => {
                if (!cancelled) setError(err.response?.data?.message || 'Failed to load')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [workflowId])

    const maxCompleted = data?.steps
        ? Math.max(...data.steps.map((s) => s.completedCount), 1)
        : 1

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative my-8 w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : error ? (
                            <div className="py-20 text-center">
                                <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
                                <p className="text-sm text-slate-600">{error}</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="mb-6 pr-8">
                                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                        {data.workflowName}
                                    </h2>
                                    {data.session && (
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            Session {data.session}
                                        </p>
                                    )}
                                </div>

                                {/* Stat cards */}
                                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <StatCard
                                        label="Enrolled"
                                        value={data.totalEnrolled}
                                        icon={Users}
                                        accent="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                                        hint="Total students"
                                    />
                                    <StatCard
                                        label="Completed"
                                        value={data.totalCompleted}
                                        icon={Award}
                                        accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                        hint={`${data.totalEnrolled > 0
                                            ? Math.round((data.totalCompleted / data.totalEnrolled) * 100)
                                            : 0}% of enrolled`}
                                    />
                                    <StatCard
                                        label="In Progress"
                                        value={data.totalInProgress}
                                        icon={Clock}
                                        accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                                        hint="Active now"
                                    />
                                    <StatCard
                                        label="Avg Completion"
                                        value={`${data.avgCompletionDays}d`}
                                        icon={TrendingUp}
                                        accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                                        hint="From start to finish"
                                    />
                                </div>

                                {/* Steps funnel */}
                                <div className="space-y-3">
                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Step-by-step funnel
                                    </div>
                                    {data.steps.map((step) => (
                                        <StepRow key={step.order} step={step} maxCompleted={maxCompleted} />
                                    ))}
                                </div>

                                {/* Bottleneck summary */}
                                {data.steps.some((s) => s.isBottleneck) && (
                                    <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <div className="text-xs">
                                            <div className="font-semibold text-amber-900 dark:text-amber-200">
                                                Bottleneck detected
                                            </div>
                                            <div className="mt-0.5 text-amber-800 dark:text-amber-300">
                                                Students are spending the most time at{' '}
                                                <strong>
                                                    {data.steps.find((s) => s.isBottleneck)?.label
                                                        || data.steps.find((s) => s.isBottleneck)?.queueName}
                                                </strong>. Consider assigning more staff or extending its operating hours.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </>
    )
}