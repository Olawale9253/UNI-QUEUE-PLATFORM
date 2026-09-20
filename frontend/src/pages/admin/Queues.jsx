import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Pencil,
    Trash2,
    MapPin,
    Clock,
    LayoutGrid,
    Search,
    Building2,
    Layers,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { groupQueuesByDepartment } from '../../lib/groupQueues'
import { stagger, staggerItem, expand } from '../../lib/motion'

const emptyForm = {
    name: '',
    description: '',
    department: '',
    subDepartment: '',
    location: '',
    opensAt: '08:00',
    closesAt: '17:00',
    maxCapacity: 50,
    averageServiceMinutes: 5,
    allowWaitlist: true,
    autoPromoteWaitlist: true,
    maxWaitlistSize: 20,
}

export default function Queues() {
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [search, setSearch] = useState('')

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/admin/queues')
            setQueues(res.data.data || [])
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load queues' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    const setField = (f) => (e) => setForm({ ...form, [f]: e.target.value })

    const openCreate = (prefill = {}) => {
        setForm({ ...emptyForm, ...prefill })
        setEditingId(null)
        setShowForm(true)
        setTimeout(() => {
            document.getElementById('queue-form')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        }, 50)
    }

    const openEdit = (queue) => {
        setForm({
            name: queue.name || '',
            description: queue.description || '',
            department: queue.department || '',
            subDepartment: queue.subDepartment || '',
            location: queue.location || '',
            opensAt: (queue.opensAt || '08:00').slice(0, 5),
            closesAt: (queue.closesAt || '17:00').slice(0, 5),
            maxCapacity: queue.maxCapacity ?? 50,
            averageServiceMinutes: queue.averageServiceMinutes ?? 5,
            allowWaitlist: queue.allowWaitlist ?? true,
            autoPromoteWaitlist: queue.autoPromoteWaitlist ?? true,
            maxWaitlistSize: queue.maxWaitlistSize ?? 20,
        })
        setEditingId(queue.id)
        setShowForm(true)
        setTimeout(() => {
            document.getElementById('queue-form')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        }, 50)
    }

    const closeForm = () => {
        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm)
    }

    const save = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                name: form.name,
                description: form.description || null,
                department: form.department?.trim() || null,
                subDepartment: form.subDepartment?.trim() || null,
                location: form.location || null,
                opensAt: `${form.opensAt}:00`,
                closesAt: `${form.closesAt}:00`,
                maxCapacity: Number(form.maxCapacity),
                averageServiceMinutes: Number(form.averageServiceMinutes),
                allowWaitlist: form.allowWaitlist,
                autoPromoteWaitlist: form.autoPromoteWaitlist,
                maxWaitlistSize: Number(form.maxWaitlistSize),
            }
            if (editingId) {
                await api.put(`/api/admin/queues/${editingId}`, payload)
                push({ type: 'success', message: 'Queue updated' })
            } else {
                await api.post('/api/admin/queues', payload)
                push({ type: 'success', message: 'Queue created' })
            }
            closeForm()
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to save queue' })
        } finally {
            setSaving(false)
        }
    }

    const deleteQueue = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/admin/queues/${deleteTarget.id}`)
            push({ type: 'success', message: 'Queue deleted' })
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
                <SkeletonQueueGrid count={6} />
            </div>
        )
    }

    const filteredQueues = queues.filter((q) => {
        if (!search.trim()) return true
        const s = search.toLowerCase()
        return (
            q.name?.toLowerCase().includes(s) ||
            q.department?.toLowerCase().includes(s) ||
            q.subDepartment?.toLowerCase().includes(s) ||
            q.location?.toLowerCase().includes(s)
        )
    })

    const groups = groupQueuesByDepartment(filteredQueues)

    const QueueCard = ({ q }) => (
        <motion.div variants={staggerItem}>
            <Card className="flex h-full flex-col">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900">{q.name}</h3>
                    <Badge variant={q.isActive ? 'success' : 'default'}>
                        {q.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </div>

                {q.location && (
                    <p className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {q.location}
                    </p>
                )}

                {q.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{q.description}</p>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs">
                    <div>
                        <div className="text-slate-500">Capacity</div>
                        <div className="mt-0.5 text-sm font-medium text-slate-900">
                            {q.maxCapacity}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-500">Avg. min</div>
                        <div className="mt-0.5 text-sm font-medium text-slate-900">
                            {q.averageServiceMinutes}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-500">Staff</div>
                        <div className="mt-0.5 text-sm font-medium text-slate-900">
                            {q.staffCount ?? 0}
                        </div>
                    </div>
                </div>

                {q.opensAt && q.closesAt && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Open {String(q.opensAt).slice(0, 5)} –{' '}
                        {String(q.closesAt).slice(0, 5)}
                    </div>
                )}

                <div className="mt-auto flex items-center gap-2 pt-5">
                    <Button
                        size="sm"
                        variant="secondary"
                        icon={Pencil}
                        onClick={() => openEdit(q)}
                        fullWidth
                    >
                        Edit
                    </Button>
                    <button
                        onClick={() => setDeleteTarget(q)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Delete queue"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </Card>
        </motion.div>
    )

    return (
        <>
            <PageHeader
                title="Queue Management"
                description="Create, edit, and remove the queues your students can join."
                action={
                    <Button
                        icon={Plus}
                        onClick={() => (showForm ? closeForm() : openCreate())}
                        variant={showForm ? 'secondary' : 'primary'}
                    >
                        {showForm ? 'Cancel' : 'New queue'}
                    </Button>
                }
            />

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        id="queue-form"
                        variants={expand}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="mb-8 overflow-hidden"
                    >
                        <Card>
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                {editingId ? 'Edit queue' : 'Create queue'}
                            </h3>
                            <form onSubmit={save} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input
                                        label="Queue name"
                                        value={form.name}
                                        onChange={setField('name')}
                                        placeholder="e.g. Fee Payments"
                                        required
                                    />
                                    <Input
                                        label="Location"
                                        value={form.location}
                                        onChange={setField('location')}
                                        placeholder="e.g. Block A, Room 12"
                                        icon={MapPin}
                                    />
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Hierarchy (optional)
                                    </p>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <Input
                                            label="Department"
                                            value={form.department}
                                            onChange={setField('department')}
                                            placeholder="e.g. Bursary"
                                            icon={Building2}
                                            hint="Top-level grouping"
                                        />
                                        <Input
                                            label="Sub-department"
                                            value={form.subDepartment}
                                            onChange={setField('subDepartment')}
                                            placeholder="e.g. Cashier Desk"
                                            icon={Layers}
                                            hint="Middle level inside the department"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input
                                        label="Description"
                                        value={form.description}
                                        onChange={setField('description')}
                                        placeholder="What is this queue for?"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Opens at"
                                            type="time"
                                            value={form.opensAt}
                                            onChange={setField('opensAt')}
                                        />
                                        <Input
                                            label="Closes at"
                                            type="time"
                                            value={form.closesAt}
                                            onChange={setField('closesAt')}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Max capacity"
                                        type="number"
                                        min="1"
                                        value={form.maxCapacity}
                                        onChange={setField('maxCapacity')}
                                        hint="Maximum number of waiting tickets"
                                    />
                                    <Input
                                        label="Avg. service minutes"
                                        type="number"
                                        min="1"
                                        value={form.averageServiceMinutes}
                                        onChange={setField('averageServiceMinutes')}
                                        hint="Used for wait-time estimates"
                                    />
                                </div>

                                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={form.allowWaitlist}
                                            onChange={(e) =>
                                                setForm({ ...form, allowWaitlist: e.target.checked })
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                        />
                                        Allow students to join a waitlist when the queue is full
                                    </label>
                                    {form.allowWaitlist && (
                                        <>
                                            <label className="ml-6 flex items-center gap-2 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={form.autoPromoteWaitlist}
                                                    onChange={(e) =>
                                                        setForm({ ...form, autoPromoteWaitlist: e.target.checked })
                                                    }
                                                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                                />
                                                Automatically promote waitlisted students when a slot opens
                                            </label>
                                            <div className="ml-6">
                                                <Input
                                                    label="Max waitlist size"
                                                    type="number"
                                                    min="0"
                                                    value={form.maxWaitlistSize}
                                                    onChange={setField('maxWaitlistSize')}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={closeForm}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={saving} disabled={saving}>
                                        {editingId ? 'Save changes' : 'Create queue'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {queues.length > 0 && (
                <div className="mb-4">
                    <Input
                        placeholder="Search by name, department, sub-department, or location…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={Search}
                    />
                </div>
            )}

            {queues.length === 0 ? (
                <EmptyState
                    icon={LayoutGrid}
                    title="No queues yet"
                    description="Create your first queue to start serving students."
                    action={
                        <Button icon={Plus} onClick={() => openCreate()}>
                            Create queue
                        </Button>
                    }
                />
            ) : filteredQueues.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No queues match your search"
                    description="Try a different search term."
                    action={
                        <Button variant="secondary" onClick={() => setSearch('')}>
                            Clear search
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-10">
                    {groups.map((group, groupIdx) => (
                        <motion.section
                            key={group.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: groupIdx * 0.05 }}
                        >
                            {/* Department header */}
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-brand-200 pb-2">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-brand-600" />
                                    <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                                        {group.label}
                                    </h4>
                                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                    {group.totalQueues}{' '}
                                        {group.totalQueues === 1 ? 'queue' : 'queues'}
                  </span>
                                </div>
                                {!group.isOther && (
                                    <button
                                        onClick={() => openCreate({ department: group.label })}
                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add to {group.label}
                                    </button>
                                )}
                            </div>

                            {/* Direct queues (no sub-department) */}
                            {group.queues.length > 0 && (
                                <motion.div
                                    variants={stagger(0, 0.05)}
                                    initial="initial"
                                    animate="animate"
                                    className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                                >
                                    {group.queues.map((q) => (
                                        <QueueCard key={q.id} q={q} />
                                    ))}
                                </motion.div>
                            )}

                            {/* Sub-department groups */}
                            {group.subGroups.map((sub) => (
                                <div key={sub.key} className="mb-6">
                                    {/* Sub-department header */}
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-l-4 border-slate-300 pl-3">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {sub.label}
                      </span>
                                            <span className="text-[10px] text-slate-400">
                        ({sub.queues.length})
                      </span>
                                        </div>
                                        <button
                                            onClick={() =>
                                                openCreate({
                                                    department: group.label,
                                                    subDepartment: sub.label,
                                                })
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-brand-600"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add queue
                                        </button>
                                    </div>

                                    <motion.div
                                        variants={stagger(0, 0.05)}
                                        initial="initial"
                                        animate="animate"
                                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                                    >
                                        {sub.queues.map((q) => (
                                            <QueueCard key={q.id} q={q} />
                                        ))}
                                    </motion.div>
                                </div>
                            ))}
                        </motion.section>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={deleteQueue}
                title={`Delete "${deleteTarget?.name}"?`}
                description="This will remove the queue and all its ticket history. Students will no longer see this queue."
                confirmLabel="Delete queue"
                variant="danger"
                loading={deleting}
            />
        </>
    )
}