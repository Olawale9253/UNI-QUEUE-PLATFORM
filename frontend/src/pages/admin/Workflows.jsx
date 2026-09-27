import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Route as RouteIcon,
    Trash2,
    ChevronUp,
    ChevronDown,
    X,
    Users,
    CheckCircle2,
    Info,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem, expand } from '../../lib/motion'

export default function Workflows() {
    const { push } = useToastStore()
    const [workflows, setWorkflows] = useState([])
    const [queues, setQueues] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const [form, setForm] = useState({
        name: '',
        description: '',
        session: '',
        steps: [{ queueId: '', label: '', instructions: '', isRequired: true }],
    })

    const load = useCallback(async () => {
        try {
            const [w, q] = await Promise.all([
                api.get('/api/admin/workflows'),
                api.get('/api/admin/queues'),
            ])
            setWorkflows(w.data.data || [])
            setQueues(q.data.data || [])
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    const addStep = () => {
        setForm({
            ...form,
            steps: [...form.steps, { queueId: '', label: '', instructions: '', isRequired: true }],
        })
    }

    const removeStep = (idx) => {
        if (form.steps.length <= 1) return
        setForm({ ...form, steps: form.steps.filter((_, i) => i !== idx) })
    }

    const moveStep = (idx, dir) => {
        const newSteps = [...form.steps]
        const target = idx + dir
        if (target < 0 || target >= newSteps.length) return
            ;[newSteps[idx], newSteps[target]] = [newSteps[target], newSteps[idx]]
        setForm({ ...form, steps: newSteps })
    }

    const updateStep = (idx, field, value) => {
        const newSteps = [...form.steps]
        newSteps[idx] = { ...newSteps[idx], [field]: value }
        setForm({ ...form, steps: newSteps })
    }

    const submit = async (e) => {
        e.preventDefault()
        if (form.steps.some((s) => !s.queueId)) {
            push({ type: 'error', message: 'Please select a queue for every step' })
            return
        }
        setCreating(true)
        try {
            await api.post('/api/admin/workflows', {
                name: form.name,
                description: form.description || null,
                session: form.session || null,
                steps: form.steps.map((s) => ({
                    queueId: Number(s.queueId),
                    label: s.label || null,
                    instructions: s.instructions || null,
                    isRequired: s.isRequired,
                })),
            })
            push({ type: 'success', message: 'Workflow created' })
            setForm({
                name: '',
                description: '',
                session: '',
                steps: [{ queueId: '', label: '', instructions: '', isRequired: true }],
            })
            setShowCreate(false)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to create workflow' })
        } finally {
            setCreating(false)
        }
    }

    const deleteWorkflow = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/admin/workflows/${deleteTarget.id}`)
            push({ type: 'success', message: 'Workflow deleted' })
            setDeleteTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to delete' })
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        )
    }

    const queueOptions = queues.map((q) => ({ value: q.id, label: q.name }))

    return (
        <>
            <PageHeader
                title="Workflows"
                description="Build multi-step clearance chains. Students complete them in order."
                action={
                    <Button
                        icon={Plus}
                        onClick={() => setShowCreate((v) => !v)}
                        variant={showCreate ? 'secondary' : 'primary'}
                    >
                        {showCreate ? 'Cancel' : 'New workflow'}
                    </Button>
                }
            />

            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        variants={expand}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="mb-8 overflow-hidden"
                    >
                        <Card>
                            <h3 className="mb-4 text-base font-semibold text-slate-900">Create workflow</h3>
                            <form onSubmit={submit} className="space-y-5">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Workflow name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Enter workflow name"
                                        required
                                    />
                                    <Input
                                        label="Session"
                                        value={form.session}
                                        onChange={(e) => setForm({ ...form, session: e.target.value })}
                                        placeholder="Enter session"
                                    />
                                </div>

                                <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                                    <div>
                                        <p className="font-medium">What is this?</p>
                                        <p className="mt-1 text-xs text-sky-800">
                                            This is a required multi-step process. Complete each service in order —
                                            locked steps unlock as you finish the previous one.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Description
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="What does this workflow accomplish?"
                                        className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                                    />
                                </div>

                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">
                                            Steps (in order)
                                        </label>
                                        <Button type="button" size="sm" variant="secondary" icon={Plus} onClick={addStep}>
                                            Add step
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {form.steps.map((step, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                                            >
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-sm font-medium text-slate-700">
                                                            Step {idx + 1}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveStep(idx, -1)}
                                                            disabled={idx === 0}
                                                            className="rounded p-1 text-slate-400 hover:bg-white disabled:opacity-30"
                                                        >
                                                            <ChevronUp className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveStep(idx, 1)}
                                                            disabled={idx === form.steps.length - 1}
                                                            className="rounded p-1 text-slate-400 hover:bg-white disabled:opacity-30"
                                                        >
                                                            <ChevronDown className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeStep(idx)}
                                                            disabled={form.steps.length === 1}
                                                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <Select
                                                        label="Service"
                                                        value={step.queueId}
                                                        onChange={(e) => updateStep(idx, 'queueId', e.target.value)}
                                                        options={queueOptions}
                                                        placeholder="Select service"
                                                        required
                                                    />
                                                    <Input
                                                        label="Label (optional)"
                                                        value={step.label}
                                                        onChange={(e) => updateStep(idx, 'label', e.target.value)}
                                                        placeholder="Enter a short description"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setShowCreate(false)}
                                        disabled={creating}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={creating} disabled={creating}>
                                        Create workflow
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {workflows.length === 0 ? (
                <EmptyState
                    icon={RouteIcon}
                    title="No active workflows"
                    description="Workflows are multi-step processes assigned by your university — like clearance or registration — where students visit several services in order. When you create one, it will appear here."
                    action={
                        <Button icon={Plus} onClick={() => setShowCreate(true)}>
                            Create workflow
                        </Button>
                    }
                />
            ) : (
                <motion.div
                    variants={stagger(0, 0.05)}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                    {workflows.map((w) => (
                        <motion.div key={w.id} variants={staggerItem}>
                            <Card className="flex h-full flex-col">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <RouteIcon className="h-4 w-4 text-brand-600" />
                                            <h3 className="text-base font-semibold text-slate-900">{w.name}</h3>
                                        </div>
                                        {w.session && (
                                            <p className="mt-0.5 text-xs text-slate-500">Session {w.session}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={w.isActive ? 'success' : 'default'}>
                                            {w.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <button
                                            onClick={() => setDeleteTarget(w)}
                                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                            aria-label="Delete workflow"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {w.description && (
                                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{w.description}</p>
                                )}

                                <ol className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
                                    {w.steps.map((s, idx) => (
                                        <li key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                                                {idx + 1}
                                            </span>
                                            <span className="flex-1 truncate">
                                                {s.queueName}
                                                {s.label && (
                                                    <span className="ml-1.5 text-xs text-slate-500">· {s.label}</span>
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ol>

                                <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5" />
                                        {w.inProgressCount ?? 0} in progress
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {w.completedCount ?? 0} completed
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={deleteWorkflow}
                title={`Delete "${deleteTarget?.name}"?`}
                description="Workflows with students still in progress cannot be deleted. Make sure all students have completed or abandoned it first."
                confirmLabel="Delete workflow"
                variant="danger"
                loading={deleting}
            />
        </>
    )
}