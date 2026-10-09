import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Trash2,
    BarChart3,
    Workflow as WorkflowIcon,
    Loader2,
    AlertTriangle,
    X,
    Users,
    ListChecks,
    Layers,
    CalendarDays,
    ChevronUp,
    ChevronDown,
    Save,
    RefreshCw,
} from 'lucide-react'
import { toast } from '../../components/ui/Toast'
import api from '../../api/axios'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import WorkflowAnalyticsModal from '../../components/admin/WorkflowAnalyticsModal'

/* ============================================================
   Small presentational helpers
   ============================================================ */

function PageHeader({ onCreate, onRefresh, refreshing }) {
    return (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Workflows
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Multi-step clearance flows that route students through your offices.
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
                <button
                    onClick={onCreate}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                    <Plus className="h-4 w-4" />
                    New Workflow
                </button>
            </div>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
    )
}

function ErrorState({ message, onRetry }) {
    return (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/20">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
            <p className="text-sm font-medium text-rose-800 dark:text-rose-300">{message}</p>
            <button
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
            </button>
        </div>
    )
}

function EmptyState({ onCreate }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40">
                <WorkflowIcon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                No workflows yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Create your first workflow to route students through offices step by step.
            </p>
            <button
                onClick={onCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
                <Plus className="h-4 w-4" />
                Create Workflow
            </button>
        </div>
    )
}

function WorkflowCard({ workflow, onAnalytics, onDelete }) {
    const stepCount = workflow.stepCount ?? workflow.steps?.length ?? 0
    const enrolled = workflow.enrolledCount ?? workflow.enrollmentCount ?? 0

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="group relative rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-700"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm">
                        <WorkflowIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {workflow.name}
                        </h3>
                        {workflow.session && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                <CalendarDays className="h-3 w-3" />
                                {workflow.session}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <button
                        onClick={() => onAnalytics(workflow.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-400"
                        aria-label="View analytics"
                        title="View analytics"
                    >
                        <BarChart3 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(workflow)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        aria-label="Delete workflow"
                        title="Delete workflow"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                    <ListChecks className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                        <strong className="font-semibold text-slate-700 dark:text-slate-300">
                            {stepCount}
                        </strong>{' '}
                        {stepCount === 1 ? 'step' : 'steps'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                        <strong className="font-semibold text-slate-700 dark:text-slate-300">
                            {enrolled}
                        </strong>{' '}
                        enrolled
                    </span>
                </div>
            </div>

            {workflow.steps?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {workflow.steps.slice(0, 4).map((step, i) => (
                        <span
                            key={step.id ?? i}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] font-bold text-slate-500 dark:bg-slate-900">
                                {i + 1}
                            </span>
                            {step.label || step.queueName || `Step ${i + 1}`}
                        </span>
                    ))}
                    {workflow.steps.length > 4 && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            +{workflow.steps.length - 4} more
                        </span>
                    )}
                </div>
            )}
        </motion.div>
    )
}

/* ============================================================
   Create Workflow Modal
   ============================================================ */

function CreateWorkflowModal({ open, onClose, onCreated }) {
    const [name, setName] = useState('')
    const [session, setSession] = useState('')
    const [queues, setQueues] = useState([])
    const [selectedSteps, setSelectedSteps] = useState([])
    const [loadingQueues, setLoadingQueues] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) {
            setName('')
            setSession('')
            setSelectedSteps([])
            setLoadingQueues(true)
            api
                .get('/api/admin/queues')
                .then((res) => setQueues(res.data.data || []))
                .catch(() => toast.error('Failed to load queues'))
                .finally(() => setLoadingQueues(false))
        }
    }, [open])

    const availableQueues = queues.filter(
        (q) => !selectedSteps.some((s) => s.queueId === q.id),
    )

    const addStep = (queue) => {
        setSelectedSteps((prev) => [
            ...prev,
            { queueId: queue.id, label: queue.name },
        ])
    }

    const removeStep = (index) => {
        setSelectedSteps((prev) => prev.filter((_, i) => i !== index))
    }

    const moveStep = (index, dir) => {
        setSelectedSteps((prev) => {
            const next = [...prev]
            const target = index + dir
            if (target < 0 || target >= next.length) return prev
                ;[next[index], next[target]] = [next[target], next[index]]
            return next
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error('Workflow name is required')
            return
        }
        if (selectedSteps.length === 0) {
            toast.error('Add at least one step')
            return
        }

        setSaving(true)
        try {
            const res = await api.post('/api/admin/workflows', {
                name: name.trim(),
                session: session.trim() || null,
                steps: selectedSteps.map((s, i) => ({
                    queueId: s.queueId,
                    label: s.label,
                    stepOrder: i + 1,
                })),
            })
            toast.success('Workflow created')
            onCreated?.(res.data.data)
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create workflow')
        } finally {
            setSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {open && (
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
                            className="relative my-8 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                        >
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="mb-5 pr-8">
                                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                        Create Workflow
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Give it a name and pick the queues students flow through.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Workflow Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Fresher Registration Clearance"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Session (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={session}
                                            onChange={(e) => setSession(e.target.value)}
                                            placeholder="e.g. 2026/2027"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Steps
                                        </label>

                                        {selectedSteps.length === 0 ? (
                                            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                                                <Layers className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                                                Add queues below to build the flow.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedSteps.map((step, i) => (
                                                    <div
                                                        key={`${step.queueId}-${i}`}
                                                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40"
                                                    >
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                                                            {i + 1}
                                                        </span>
                                                        <input
                                                            value={step.label}
                                                            onChange={(e) =>
                                                                setSelectedSteps((prev) =>
                                                                    prev.map((s, idx) =>
                                                                        idx === i
                                                                            ? { ...s, label: e.target.value }
                                                                            : s,
                                                                    ),
                                                                )
                                                            }
                                                            className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-800 outline-none dark:text-slate-200"
                                                        />
                                                        <div className="flex items-center gap-0.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => moveStep(i, -1)}
                                                                disabled={i === 0}
                                                                className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700"
                                                                aria-label="Move up"
                                                            >
                                                                <ChevronUp className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveStep(i, 1)}
                                                                disabled={i === selectedSteps.length - 1}
                                                                className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700"
                                                                aria-label="Move down"
                                                            >
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeStep(i)}
                                                                className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                                                aria-label="Remove step"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-3">
                                            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Available queues
                                            </div>
                                            {loadingQueues ? (
                                                <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    Loading queues…
                                                </div>
                                            ) : availableQueues.length === 0 ? (
                                                <div className="py-2 text-xs text-slate-400">
                                                    {queues.length === 0
                                                        ? 'No queues found. Create queues first.'
                                                        : 'All queues have been added.'}
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableQueues.map((q) => (
                                                        <button
                                                            key={q.id}
                                                            type="button"
                                                            onClick={() => addStep(q)}
                                                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-brand-950/40"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            {q.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        Create Workflow
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}

/* ============================================================
   Main Page
   ============================================================ */

export default function Workflows() {
    const [workflows, setWorkflows] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)

    const [createOpen, setCreateOpen] = useState(false)
    const [analyticsTarget, setAnalyticsTarget] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        setError(null)

        try {
            const res = await api.get('/api/admin/workflows')
            setWorkflows(res.data.data || [])
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load workflows')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const handleCreated = () => {
        load(true)
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/admin/workflows/${deleteTarget.id}`)
            setWorkflows((prev) => prev.filter((w) => w.id !== deleteTarget.id))
            toast.success('Workflow deleted')
            setDeleteTarget(null)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete workflow')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <PageHeader
                onCreate={() => setCreateOpen(true)}
                onRefresh={() => load(true)}
                refreshing={refreshing}
            />

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} onRetry={() => load()} />
            ) : workflows.length === 0 ? (
                <EmptyState onCreate={() => setCreateOpen(true)} />
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {workflows.map((w) => (
                            <WorkflowCard
                                key={w.id}
                                workflow={w}
                                onAnalytics={setAnalyticsTarget}
                                onDelete={setDeleteTarget}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <CreateWorkflowModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={handleCreated}
            />

            <AnimatePresence>
                {analyticsTarget && (
                    <WorkflowAnalyticsModal
                        workflowId={analyticsTarget}
                        onClose={() => setAnalyticsTarget(null)}
                    />
                )}
            </AnimatePresence>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete workflow?"
                description={
                    deleteTarget
                        ? `"${deleteTarget.name}" will be permanently removed. Any students currently enrolled in it may lose their progress. This cannot be undone.`
                        : ''
                }
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                loading={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setDeleteTarget(null)}
            />
        </div>
    )
}