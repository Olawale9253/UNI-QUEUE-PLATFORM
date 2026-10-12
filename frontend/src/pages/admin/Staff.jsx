import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Trash2,
    Mail,
    Phone,
    Building2,
    X,
    Users,
    Link as LinkIcon,
    Search,
    Check,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ExportButton from '../../components/ui/ExportButton'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem, expand } from '../../lib/motion'

const initialForm = {
    fullName: '',
    email: '',
    password: '',
    department: '',
    phone: '',
}

function SelectCheckbox({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation()
                if (disabled) return
                onChange(!checked)
            }}
            disabled={disabled}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors disabled:opacity-50 ${
                checked
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white hover:border-brand-400 dark:border-slate-600 dark:bg-slate-900'
            }`}
            aria-label={checked ? 'Deselect' : 'Select'}
        >
            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>
    )
}

function BulkToolbar({ count, onClear, onRemove, busy }) {
    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
                >
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                            {count} selected
                        </span>
                        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
                        <button
                            onClick={onRemove}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            {busy ? 'Removing…' : 'Remove from all queues'}
                        </button>
                        <button
                            onClick={onClear}
                            disabled={busy}
                            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800"
                            aria-label="Clear selection"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default function Staff() {
    const { push } = useToastStore()
    const [staff, setStaff] = useState([])
    const [queues, setQueues] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [assignTarget, setAssignTarget] = useState(null)
    const [assigning, setAssigning] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [search, setSearch] = useState('')

    const [selectedIds, setSelectedIds] = useState(() => new Set())
    const [bulkBusy, setBulkBusy] = useState(false)
    const [bulkConfirm, setBulkConfirm] = useState(false)

    const load = useCallback(async () => {
        try {
            const [s, q] = await Promise.all([
                api.get('/api/admin/staff'),
                api.get('/api/admin/queues'),
            ])
            setStaff(s.data.data || [])
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

    const setField = (f) => (e) => setForm({ ...form, [f]: e.target.value })

    const createStaff = async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
            await api.post('/api/admin/staff', form)
            push({ type: 'success', message: 'Staff member added' })
            setForm(initialForm)
            setShowCreate(false)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to create staff' })
        } finally {
            setCreating(false)
        }
    }

    const assignToQueue = async (queueId) => {
        if (!assignTarget) return
        setAssigning(true)
        try {
            await api.post(`/api/admin/queues/${queueId}/staff/${assignTarget.id}`)
            push({ type: 'success', message: 'Staff assigned to queue' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to assign' })
        } finally {
            setAssigning(false)
        }
    }

    const unassignFromQueue = async (queueId, staffId) => {
        try {
            await api.delete(`/api/admin/queues/${queueId}/staff/${staffId}`)
            push({ type: 'success', message: 'Staff removed from queue' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to unassign' })
        }
    }

    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const clearSelection = () => setSelectedIds(new Set())

    const assignmentsByStaff = new Map()
    queues.forEach((q) => {
        ;(q.staff || []).forEach((s) => {
            if (!assignmentsByStaff.has(s.id)) assignmentsByStaff.set(s.id, [])
            assignmentsByStaff.get(s.id).push({ queueId: q.id, queueName: q.name })
        })
    })

    const filteredStaff = staff.filter((s) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
            s.fullName?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            s.department?.toLowerCase().includes(q)
        )
    })

    const allVisibleSelected =
        filteredStaff.length > 0 && filteredStaff.every((s) => selectedIds.has(s.id))

    const toggleSelectAllVisible = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (allVisibleSelected) {
                filteredStaff.forEach((s) => next.delete(s.id))
            } else {
                filteredStaff.forEach((s) => next.add(s.id))
            }
            return next
        })
    }

    const handleBulkRemove = async () => {
        const ids = Array.from(selectedIds)
        if (ids.length === 0) return
        setBulkBusy(true)
        try {
            const res = await api.post('/api/admin/bulk/staff/remove-from-all-queues', { ids })
            const result = res.data?.data || {}
            const succeeded = result.succeeded ?? 0
            const failed = result.failed?.length ?? 0

            if (failed === 0) {
                push({
                    type: 'success',
                    message: `${succeeded} staff member${succeeded === 1 ? '' : 's'} removed from all queues`,
                })
            } else {
                push({
                    type: 'warning',
                    message: `${succeeded} removed, ${failed} failed — ${result.failed[0]?.reason || 'see logs'}`,
                })
            }

            setBulkConfirm(false)
            clearSelection()
            await load()
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Bulk removal failed',
            })
        } finally {
            setBulkBusy(false)
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

    return (
        <>
            <PageHeader
                title="Staff Management"
                description="Add staff members and assign them to queues so they can serve students."
                action={
                    <Button
                        icon={Plus}
                        onClick={() => setShowCreate((v) => !v)}
                        variant={showCreate ? 'secondary' : 'primary'}
                    >
                        {showCreate ? 'Cancel' : 'Add staff'}
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
                            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                                Add a new staff member
                            </h3>
                            <form onSubmit={createStaff} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input label="Full name" value={form.fullName} onChange={setField('fullName')} placeholder="Jane Doe" required />
                                <Input label="Email" type="email" value={form.email} onChange={setField('email')} placeholder="jane.staff@university.edu.ng" required />
                                <Input label="Password" type="password" value={form.password} onChange={setField('password')} placeholder="At least 8 characters" required />
                                <Input label="Department" value={form.department} onChange={setField('department')} placeholder="e.g. Bursary" icon={Building2} />
                                <Input label="Phone" value={form.phone} onChange={setField('phone')} placeholder="e.g. 08012345678" icon={Phone} />
                                <div className="md:col-span-2">
                                    <Button type="submit" loading={creating} disabled={creating}>
                                        Create staff account
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {staff.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <Input
                            placeholder="Search by name, email, or department…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={Search}
                        />
                    </div>
                    <ExportButton
                        rows={filteredStaff.map((s) => ({
                            ...s,
                            assignedQueues: (assignmentsByStaff.get(s.id) || [])
                                .map((a) => a.queueName)
                                .join(', '),
                        }))}
                        columns={[
                            { key: 'id', label: 'Staff ID' },
                            { key: 'fullName', label: 'Full Name' },
                            { key: 'email', label: 'Email' },
                            { key: 'department', label: 'Department' },
                            { key: 'phone', label: 'Phone' },
                            { key: 'assignedQueues', label: 'Assigned Queues' },
                        ]}
                        filename="uniqueue-staff"
                        label="Export"
                    />
                    {filteredStaff.length > 0 && (
                        <button
                            onClick={toggleSelectAllVisible}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <span
                                className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                                    allVisibleSelected
                                        ? 'border-brand-600 bg-brand-600 text-white'
                                        : 'border-slate-300 dark:border-slate-600'
                                }`}
                            >
                                {allVisibleSelected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                            </span>
                            {allVisibleSelected ? 'Deselect all' : 'Select all'}
                        </button>
                    )}
                </div>
            )}

            {staff.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No staff members yet"
                    description="Add your first staff member so they can begin serving students."
                    action={
                        <Button icon={Plus} onClick={() => setShowCreate(true)}>
                            Add staff
                        </Button>
                    }
                />
            ) : filteredStaff.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No staff match your search"
                    description="Try a different name, email, or department."
                    action={
                        <Button variant="secondary" onClick={() => setSearch('')}>
                            Clear search
                        </Button>
                    }
                />
            ) : (
                <motion.div
                    variants={stagger(0, 0.05)}
                    initial="initial"
                    animate="animate"
                    className="space-y-3"
                >
                    {filteredStaff.map((s) => {
                        const assigned = assignmentsByStaff.get(s.id) || []
                        const isSelected = selectedIds.has(s.id)
                        return (
                            <motion.div key={s.id} variants={staggerItem}>
                                <Card
                                    className={
                                        isSelected
                                            ? '!border-brand-400 ring-2 ring-brand-100 dark:!border-brand-600 dark:ring-brand-950/40'
                                            : undefined
                                    }
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="pt-1">
                                                <SelectCheckbox
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(s.id)}
                                                />
                                            </div>
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                                                {s.fullName?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    {s.fullName}
                                                </div>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {s.email}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {assigned.length === 0 ? (
                                                        <span className="text-xs text-slate-400">
                                                            Not assigned to any queue
                                                        </span>
                                                    ) : (
                                                        assigned.map((a) => (
                                                            <span
                                                                key={a.queueId}
                                                                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                                                            >
                                                                {a.queueName}
                                                                <button
                                                                    onClick={() => unassignFromQueue(a.queueId, s.id)}
                                                                    className="rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-950/60"
                                                                    aria-label={`Remove from ${a.queueName}`}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                icon={LinkIcon}
                                                onClick={() => setAssignTarget(s)}
                                            >
                                                Assign
                                            </Button>
                                            <button
                                                onClick={() => setDeleteTarget(s)}
                                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                                aria-label="Remove staff"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </motion.div>
            )}

            <BulkToolbar
                count={selectedIds.size}
                onClear={clearSelection}
                onRemove={() => setBulkConfirm(true)}
                busy={bulkBusy}
            />

            <AnimatePresence>
                {assignTarget && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !assigning && setAssignTarget(null)}
                            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                            >
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Assign {assignTarget.fullName}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Choose which queues this staff member should serve.
                                </p>

                                <div className="mt-5 max-h-72 space-y-2 overflow-y-auto">
                                    {queues.map((q) => {
                                        const alreadyAssigned = (q.staff || []).some(
                                            (s) => s.id === assignTarget.id
                                        )
                                        return (
                                            <button
                                                key={q.id}
                                                disabled={alreadyAssigned || assigning}
                                                onClick={() => assignToQueue(q.id)}
                                                className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left transition-colors ${
                                                    alreadyAssigned
                                                        ? 'cursor-not-allowed border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
                                                        : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-700 dark:hover:border-brand-700 dark:hover:bg-brand-950/30'
                                                }`}
                                            >
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {q.name}
                                                </span>
                                                {alreadyAssigned ? (
                                                    <Badge variant="success">Assigned</Badge>
                                                ) : (
                                                    <Plus className="h-4 w-4 text-slate-400" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setAssignTarget(null)}
                                        disabled={assigning}
                                    >
                                        Done
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={async () => {
                    setDeleting(true)
                    try {
                        const assignments = assignmentsByStaff.get(deleteTarget.id) || []
                        for (const a of assignments) {
                            await api.delete(`/api/admin/queues/${a.queueId}/staff/${deleteTarget.id}`)
                        }
                        push({ type: 'info', message: 'Removed from all queues' })
                        setDeleteTarget(null)
                        await load()
                    } catch (err) {
                        push({ type: 'error', message: err.response?.data?.message || 'Failed' })
                    } finally {
                        setDeleting(false)
                    }
                }}
                title={`Remove ${deleteTarget?.fullName}?`}
                description="This will remove the staff member from all queues. They'll no longer be able to serve students."
                confirmLabel="Remove staff"
                variant="danger"
                loading={deleting}
            />

            <ConfirmDialog
                open={bulkConfirm}
                onClose={() => !bulkBusy && setBulkConfirm(false)}
                onConfirm={handleBulkRemove}
                title={`Remove ${selectedIds.size} staff member${selectedIds.size === 1 ? '' : 's'} from all queues?`}
                description="Each selected staff member will be removed from every queue they're currently assigned to. Their accounts stay active — you can reassign them anytime."
                confirmLabel="Remove from all queues"
                cancelLabel="Cancel"
                variant="danger"
                loading={bulkBusy}
            />
        </>
    )
}