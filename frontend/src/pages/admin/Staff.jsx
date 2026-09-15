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
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
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

    if (loading) {
        return (
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        )
    }

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
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
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
                <div className="mb-4">
                    <Input
                        placeholder="Search by name, email, or department…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={Search}
                    />
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
                        return (
                            <motion.div key={s.id} variants={staggerItem}>
                                <Card>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                                                {s.fullName?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-base font-semibold text-slate-900">
                                                    {s.fullName}
                                                </div>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
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
                                                                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                                                            >
                                {a.queueName}
                                                                <button
                                                                    onClick={() => unassignFromQueue(a.queueId, s.id)}
                                                                    className="rounded-full p-0.5 hover:bg-brand-100"
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
                                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
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
                                className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                            >
                                <h3 className="text-base font-semibold text-slate-900">
                                    Assign {assignTarget.fullName}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
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
                                                        ? 'cursor-not-allowed border-emerald-200 bg-emerald-50'
                                                        : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
                                                }`}
                                            >
                        <span className="text-sm font-medium text-slate-900">
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
        </>
    )
}