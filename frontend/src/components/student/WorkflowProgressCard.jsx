import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

/**
 * Compact card for the student dashboard showing progress on a single clearance.
 * Clicking anywhere on the card opens the full MyClearancePage.
 */
export default function WorkflowProgressCard({ progress }) {
    if (!progress) return null

    const pct = progress.totalSteps > 0
        ? Math.round((progress.completedSteps / progress.totalSteps) * 100)
        : 0

    const isComplete = progress.status === 'COMPLETED'

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md ${
                isComplete
                    ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900 dark:from-emerald-950/30 dark:to-slate-900'
                    : 'border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white dark:border-brand-900 dark:from-brand-950/30 dark:via-slate-900 dark:to-slate-900'
            }`}
        >
            {/* Accent bar */}
            <div className={`h-1 ${isComplete ? 'bg-emerald-500' : 'bg-brand-600'}`} />

            <Link to={`/student/workflows/${progress.id}`} className="block p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                                isComplete ? 'text-emerald-600' : 'text-brand-600'
                            }`}>
                                {isComplete ? (
                                    <>
                                        <CheckCircle2 className="h-3 w-3" />
                                        Complete
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-3 w-3" />
                                        In progress
                                    </>
                                )}
                            </span>
                        </div>
                        <h3 className="mt-1 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                            {progress.workflowName}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {progress.completedSteps} of {progress.totalSteps} steps
                            {progress.currentStepLabel && !isComplete && (
                                <> · Now: <strong className="text-slate-700 dark:text-slate-300">{progress.currentStepLabel}</strong></>
                            )}
                        </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${
                                isComplete
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                    : 'bg-gradient-to-r from-brand-500 to-brand-600'
                            }`}
                        />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        <span>{pct}% complete</span>
                        {progress.currentQueueName && !isComplete && (
                            <span>Next up: {progress.currentQueueName}</span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}