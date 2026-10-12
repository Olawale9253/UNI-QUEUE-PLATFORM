import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Pencil, Trash2, MapPin, Clock, LayoutGrid, Search,
    Building2, GraduationCap, CalendarDays, Check, Power, PowerOff, X,
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
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem, expand } from '../../lib/motion'

const WEEKDAYS = [
    { iso: 1, short: 'Mon', label: 'Monday' },
    { iso: 2, short: 'Tue', label: 'Tuesday' },
    { iso: 3, short: 'Wed', label: 'Wednesday' },
    { iso: 4, short: 'Thu', label: 'Thursday' },
    { iso: 5, short: 'Fri', label: 'Friday' },
    { iso: 6, short: 'Sat', label: 'Saturday' },
    { iso: 7, short: 'Sun', label: 'Sunday' },
]

const DEFAULT_DAYS = [1, 2, 3, 4, 5]

const parseDays = (csv) => {
    if (!csv) return [...DEFAULT_DAYS]
    return String(csv)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => n >= 1 && n <= 7)
}

const formatDays = (arr) => {
    if (!arr || arr.length === 0) return '—'
    if (arr.length === 7) return 'Every day'
    if (arr.length === 5 && arr.every((d) => d <= 5)) return 'Mon–Fri'
    if (arr.length === 2 && arr.includes(6) && arr.includes(7)) return 'Weekends'
    return [...arr]
        .sort((a, b) => a - b)
        .map((iso) => WEEKDAYS.find((w) => w.iso === iso)?.short)
        .filter(Boolean)
        .join(', ')
}

const emptyForm = {
    name: '', description: '', officeId: '', location: '',
    opensAt: '08:00', closesAt: '17:00',
    maxCapacity: 50, averageServiceMinutes: 5,
    allowWaitlist: true, autoPromoteWaitlist: true, maxWaitlistSize: 20,
    matricRequired: false,
    operatingDays: [...DEFAULT_DAYS],
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

function BulkToolbar({ count, onClear, onActivate, onDeactivate, onDelete, busy }) {
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
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                        <span className="px-2 text-sm font-bold text-slate-900 tabular-nums dark:text-slate-100">
                            {count} selected
                        </span>
                        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
                        <button
                            onClick={onActivate}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                        >
                            <Power className="h-3.5 w-3.5" />
                            Activate
                        </button>
                        <button
                            onClick={onDeactivate}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                        >
                            <PowerOff className="h-3.5 w-3.5" />
                            Deactivate
                        </button>
                        <button
                            onClick={onDelete}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
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

export default function Queues() {
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [offices, setOffices] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [search, setSearch] = useState('')

    const [selectedIds, setSelectedIds] = useState(() => new Set())
    const [bulkBusy, setBulkBusy] = useState(false)
    const [bulkConfirm, setBulkConfirm] = useState(null)

    const load = useCallback(async () => {
        try {
            const [q, o] = await Promise.all([
                api.get('/api/admin/queues'),
                api.get('/api/admin/offices'),
            ])
            setQueues(q.data.data || [])
            setOffices(o.data.data || [])
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load data' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    const setField = (f) => (e) => setForm({ ...form, [f]: e.target.value })

    const toggleDay = (iso) => {
        setForm((prev) => {
            const current = prev.operatingDays || []
            const next = current.includes(iso)
                ? current.filter((d) => d !== iso)
                : [...current, iso]
            return { ...prev, operatingDays: next.sort((a, b) => a - b) }
        })
    }

    const setDaysPreset = (arr) => {
        setForm((prev) => ({ ...prev, operatingDays: [...arr] }))
    }

    const openCreate = (prefillOfficeId = '') => {
        setForm({ ...emptyForm, officeId: prefillOfficeId })
        setEditingId(null)
        setShowForm(true)
        setTimeout(() => document.getElementById('queue-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }

    const openEdit = (queue) => {
        setForm({
            name: queue.name || '',
            description: queue.description || '',
            officeId: queue.officeId || '',
            location: queue.location || '',
            opensAt: (queue.opensAt || '08:00').slice(0, 5),
            closesAt: (queue.closesAt || '17:00').slice(0, 5),
            maxCapacity: queue.maxCapacity ?? 50,
            averageServiceMinutes: queue.averageServiceMinutes ?? 5,
            allowWaitlist: queue.allowWaitlist ?? true,
            autoPromoteWaitlist: queue.autoPromoteWaitlist ?? true,
            maxWaitlistSize: queue.maxWaitlistSize ?? 20,
            matricRequired: queue.matricRequired ?? false,
            operatingDays: parseDays(queue.operatingDays),
        })
        setEditingId(queue.id)
        setShowForm(true)
        setTimeout(() => document.getElementById('queue-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }

    const closeForm = () => {
        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm)
    }

    const save = async (e) => {
        e.preventDefault()
        if (!form.officeId) {
            push({ type: 'error', message: 'Please select an office' })
            return
        }
        if (!form.operatingDays || form.operatingDays.length === 0) {
            push({ type: 'error', message: 'Pick at least one operating day' })
            return
        }
        setSaving(true)
        try {
            const payload = {
                name: form.name,
                description: form.description || null,
                officeId: Number(form.officeId),
                location: form.location || null,
                opensAt: `${form.opensAt}:00`,
                closesAt: `${form.closesAt}:00`,
                maxCapacity: Number(form.maxCapacity),
                averageServiceMinutes: Number(form.averageServiceMinutes),
                allowWaitlist: form.allowWaitlist,
                autoPromoteWaitlist: form.autoPromoteWaitlist,
                maxWaitlistSize: Number(form.maxWaitlistSize),
                matricRequired: !!form.matricRequired,
                operatingDays: form.operatingDays.join(','),
            }
            if (editingId) {
                await api.put(`/api/admin/queues/${editingId}`, payload)
                push({ type: 'success', message: 'Service updated' })
            } else {
                await api.post('/api/admin/queues', payload)
                push({ type: 'success', message: 'Service created' })
            }
            closeForm()
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to save service' })
        } finally {
            setSaving(false)
        }
    }

    const deleteQueue = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/admin/queues/${deleteTarget.id}`)
            push({ type: 'success', message: 'Service deleted' })
            setDeleteTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to delete' })
        } finally {
            setDeleting(false)
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

    const handleBulk = async (action) => {
        const ids = Array.from(selectedIds)
        if (ids.length === 0) return
        setBulkBusy(true)
        try {
            const endpoint =
                action === 'activate' ? '/api/admin/bulk/queues/activate'
                    : action === 'deactivate' ? '/api/admin/bulk/queues/deactivate'
                        : '/api/admin/bulk/queues/delete'
            const res = await api.post(endpoint, { ids })
            const result = res.data?.data || {}
            const succeeded = result.succeeded ?? 0
            const failed = result.failed?.length ?? 0

            if (failed === 0) {
                push({
                    type: 'success',
                    message:
                        action === 'delete'
                            ? `${succeeded} service${succeeded === 1 ? '' : 's'} deleted`
                            : `${succeeded} service${succeeded === 1 ? '' : 's'} ${action}d`,
                })
            } else {
                push({
                    type: 'warning',
                    message: `${succeeded} succeeded, ${failed} failed — ${result.failed[0]?.reason || 'see logs'}`,
                })
            }

            setBulkConfirm(null)
            clearSelection()
            await load()
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || `Bulk ${action} failed`,
            })
        } finally {
            setBulkBusy(false)
        }
    }

    const groups = (() => {
        const map = new Map()
        for (const q of queues) {
            const label = (q.officeName || 'General').trim() || 'General'
            const key = label.toLowerCase()
            if (!map.has(key)) map.set(key, { key, label, queues: [] })
            map.get(key).queues.push(q)
        }
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
    })()

    const filteredQueues = search.trim()
        ? queues.filter((q) => {
            const s = search.toLowerCase()
            return (
                q.name?.toLowerCase().includes(s) ||
                q.officeName?.toLowerCase().includes(s) ||
                q.location?.toLowerCase().includes(s)
            )
        })
        : queues

    const filteredGroups = search.trim()
        ? groups
            .map((g) => ({
                ...g,
                queues: g.queues.filter((q) => filteredQueues.includes(q)),
            }))
            .filter((g) => g.queues.length > 0)
        : groups

    const allVisibleSelected =
        filteredQueues.length > 0 && filteredQueues.every((q) => selectedIds.has(q.id))

    const toggleSelectAllVisible = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (allVisibleSelected) {
                filteredQueues.forEach((q) => next.delete(q.id))
            } else {
                filteredQueues.forEach((q) => next.add(q.id))
            }
            return next
        })
    }

    if (loading) {
        return (
            <>
                <PageHeader title="Services" description="Create and manage the services students can join." />
                <SkeletonQueueGrid count={6} />
            </>
        )
    }

    const QueueCard = ({ q }) => {
        const isSelected = selectedIds.has(q.id)
        return (
            <motion.div variants={staggerItem}>
                <Card
                    className={`flex h-full flex-col ${
                        isSelected
                            ? '!border-brand-400 ring-2 ring-brand-100 dark:!border-brand-600 dark:ring-brand-950/40'
                            : ''
                    }`}
                >
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div className="pt-1">
                                <SelectCheckbox
                                    checked={isSelected}
                                    onChange={() => toggleSelect(q.id)}
                                />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    {q.name}
                                </h3>
                                {q.matricRequired && (
                                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                        <GraduationCap className="h-3 w-3" />
                                        Matric required
                                    </span>
                                )}
                            </div>
                        </div>
                        <Badge variant={q.isActive ? 'success' : 'default'}>
                            {q.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>

                    {q.location && (
                        <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3.5 w-3.5" />
                            {q.location}
                        </p>
                    )}

                    {q.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                            {q.description}
                        </p>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                        <div>
                            <div className="text-slate-500 dark:text-slate-400">Capacity</div>
                            <div className="mt-0.5 text-sm font-bold text-brand-600 dark:text-brand-400">
                                {q.maxCapacity}
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-500 dark:text-slate-400">Avg. min</div>
                            <div className="mt-0.5 text-sm font-bold text-amber-600 dark:text-amber-400">
                                {q.averageServiceMinutes}
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-500 dark:text-slate-400">Staff</div>
                            <div className="mt-0.5 text-sm font-bold text-sky-600 dark:text-sky-400">
                                {q.staffCount ?? 0}
                            </div>
                        </div>
                    </div>

                    {q.opensAt && q.closesAt && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            Open {String(q.opensAt).slice(0, 5)} – {String(q.closesAt).slice(0, 5)}
                        </div>
                    )}

                    {q.operatingDays && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDays(parseDays(q.operatingDays))}
                        </div>
                    )}

                    <div className="mt-auto flex items-center gap-2 pt-5">
                        <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(q)} fullWidth>
                            Edit
                        </Button>
                        <button
                            onClick={() => setDeleteTarget(q)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                            aria-label="Delete service"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </Card>
            </motion.div>
        )
    }

    return (
        <>
            <PageHeader
                title="Services"
                description="Create and manage the services students can join."
                action={
                    <Button
                        icon={Plus}
                        onClick={() => (showForm ? closeForm() : openCreate())}
                        variant={showForm ? 'secondary' : 'primary'}
                    >
                        {showForm ? 'Cancel' : 'New service'}
                    </Button>
                }
            />

            <AnimatePresence>
                {showForm && (
                    <motion.div id="queue-form" variants={expand} initial="initial" animate="animate" exit="exit" className="mb-8 overflow-hidden">
                        <Card>
                            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                                {editingId ? 'Edit service' : 'Create service'}
                            </h3>
                            <form onSubmit={save} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input
                                        label="Service name"
                                        value={form.name}
                                        onChange={setField('name')}
                                        placeholder="Enter service name"
                                        required
                                    />
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Office <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.officeId}
                                            onChange={setField('officeId')}
                                            required
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            <option value="">Select office</option>
                                            {offices.map((o) => (
                                                <option key={o.id} value={o.id}>
                                                    {o.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {offices.length === 0
                                                ? 'No offices yet — create one first.'
                                                : 'Students see services grouped by office.'}
                                        </p>
                                    </div>
                                    <Input
                                        label="Location"
                                        value={form.location}
                                        onChange={setField('location')}
                                        placeholder="Enter location"
                                        icon={MapPin}
                                    />
                                    <Input
                                        label="Description"
                                        value={form.description}
                                        onChange={setField('description')}
                                        placeholder="What is this service for?"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input label="Opens at" type="time" value={form.opensAt} onChange={setField('opensAt')} />
                                    <Input label="Closes at" type="time" value={form.closesAt} onChange={setField('closesAt')} />
                                </div>

                                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                                                <CalendarDays className="h-4 w-4 text-slate-400" />
                                                Operating days
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                Students can only join on these days (respecting the university holiday calendar).
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setDaysPreset([1, 2, 3, 4, 5])}
                                                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                Mon–Fri
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDaysPreset([1, 2, 3, 4, 5, 6, 7])}
                                                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                Every day
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDaysPreset([6, 7])}
                                                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                Weekends
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {WEEKDAYS.map((day) => {
                                            const checked = form.operatingDays?.includes(day.iso)
                                            return (
                                                <button
                                                    key={day.iso}
                                                    type="button"
                                                    onClick={() => toggleDay(day.iso)}
                                                    aria-pressed={checked}
                                                    title={day.label}
                                                    className={`h-10 w-12 rounded-lg border text-xs font-semibold transition-colors ${
                                                        checked
                                                            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300'
                                                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600'
                                                    }`}
                                                >
                                                    {day.short}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {(!form.operatingDays || form.operatingDays.length === 0) && (
                                        <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                                            Pick at least one day — otherwise students can never join.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input label="Max capacity" type="number" min="1" value={form.maxCapacity} onChange={setField('maxCapacity')} hint="Maximum waiting tickets" />
                                    <Input label="Avg. service minutes" type="number" min="1" value={form.averageServiceMinutes} onChange={setField('averageServiceMinutes')} hint="Used for wait estimates" />
                                </div>

                                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                                    <input
                                        type="checkbox"
                                        checked={form.matricRequired}
                                        onChange={(e) => setForm({ ...form, matricRequired: e.target.checked })}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                                            <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                                            Matric number required
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            Freshers must upgrade to full student access before joining.
                                        </p>
                                    </div>
                                </label>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>Cancel</Button>
                                    <Button type="submit" loading={saving} disabled={saving || offices.length === 0}>
                                        {editingId ? 'Save changes' : 'Create service'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {queues.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <Input
                            placeholder="Search by service name, office, or location"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={Search}
                        />
                    </div>
                    <ExportButton
                        rows={filteredQueues}
                        columns={[
                            { key: 'id', label: 'Service ID' },
                            { key: 'name', label: 'Service Name' },
                            { key: 'officeName', label: 'Office' },
                            { key: 'location', label: 'Location' },
                            {
                                key: 'isActive',
                                label: 'Status',
                                value: (q) => (q.isActive ? 'Active' : 'Inactive'),
                            },
                            { key: 'maxCapacity', label: 'Max Capacity' },
                            { key: 'averageServiceMinutes', label: 'Avg Minutes' },
                            { key: 'waitingCount', label: 'Waiting' },
                            { key: 'staffCount', label: 'Staff' },
                            { key: 'opensAt', label: 'Opens At' },
                            { key: 'closesAt', label: 'Closes At' },
                            { key: 'operatingDays', label: 'Operating Days' },
                            {
                                key: 'matricRequired',
                                label: 'Matric Required',
                                value: (q) => (q.matricRequired ? 'Yes' : 'No'),
                            },
                        ]}
                        filename="uniqueue-services"
                        label="Export"
                    />
                    {filteredQueues.length > 0 && (
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

            {queues.length === 0 ? (
                <EmptyState
                    icon={LayoutGrid}
                    variant="info"
                    title="No services yet"
                    description="Create your first service — students will see it grouped under its office."
                    action={<Button icon={Plus} onClick={() => openCreate()}>Create service</Button>}
                />
            ) : filteredQueues.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No services match"
                    description="Try a different search term."
                    action={
                        <Button variant="secondary" onClick={() => setSearch('')}>
                            Clear search
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-8">
                    {filteredGroups.map((group, groupIdx) => (
                        <motion.section
                            key={group.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: groupIdx * 0.05 }}
                        >
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                                        {group.label}
                                    </h4>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        {group.queues.length} {group.queues.length === 1 ? 'service' : 'services'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => openCreate(group.queues[0]?.officeId || '')}
                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add to {group.label}
                                </button>
                            </div>

                            <motion.div
                                variants={stagger(0, 0.05)}
                                initial="initial"
                                animate="animate"
                                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                            >
                                {group.queues.map((q) => <QueueCard key={q.id} q={q} />)}
                            </motion.div>
                        </motion.section>
                    ))}
                </div>
            )}

            <BulkToolbar
                count={selectedIds.size}
                onClear={clearSelection}
                onActivate={() => setBulkConfirm('activate')}
                onDeactivate={() => setBulkConfirm('deactivate')}
                onDelete={() => setBulkConfirm('delete')}
                busy={bulkBusy}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={deleteQueue}
                title={`Delete "${deleteTarget?.name}"?`}
                description="This removes the service and all its ticket history."
                confirmLabel="Delete service"
                variant="danger"
                loading={deleting}
            />

            <ConfirmDialog
                open={bulkConfirm === 'activate'}
                onClose={() => !bulkBusy && setBulkConfirm(null)}
                onConfirm={() => handleBulk('activate')}
                title={`Activate ${selectedIds.size} service${selectedIds.size === 1 ? '' : 's'}?`}
                description="Students will be able to join these services again."
                confirmLabel="Activate"
                variant="info"
                loading={bulkBusy}
            />

            <ConfirmDialog
                open={bulkConfirm === 'deactivate'}
                onClose={() => !bulkBusy && setBulkConfirm(null)}
                onConfirm={() => handleBulk('deactivate')}
                title={`Deactivate ${selectedIds.size} service${selectedIds.size === 1 ? '' : 's'}?`}
                description="Students will no longer be able to join these services. Existing tickets are unaffected."
                confirmLabel="Deactivate"
                variant="warning"
                loading={bulkBusy}
            />

            <ConfirmDialog
                open={bulkConfirm === 'delete'}
                onClose={() => !bulkBusy && setBulkConfirm(null)}
                onConfirm={() => handleBulk('delete')}
                title={`Delete ${selectedIds.size} service${selectedIds.size === 1 ? '' : 's'}?`}
                description="This permanently removes the selected services and all their ticket history. This cannot be undone."
                confirmLabel="Delete services"
                variant="danger"
                loading={bulkBusy}
            />
        </>
    )
}