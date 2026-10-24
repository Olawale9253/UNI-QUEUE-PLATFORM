import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Pencil, Trash2, MapPin, Clock, LayoutGrid, Search,
    Building2, GraduationCap, CalendarDays, Check, Power, PowerOff, X as CloseIcon,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ExportButton from '../../components/ui/ExportButton'
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem, expand } from '../../lib/motion'

const WEEKDAYS = [
    { iso: 1, short: 'Mon', label: 'Monday' }, { iso: 2, short: 'Tue', label: 'Tuesday' },
    { iso: 3, short: 'Wed', label: 'Wednesday' }, { iso: 4, short: 'Thu', label: 'Thursday' },
    { iso: 5, short: 'Fri', label: 'Friday' }, { iso: 6, short: 'Sat', label: 'Saturday' },
    { iso: 7, short: 'Sun', label: 'Sunday' },
]
const DEFAULT_DAYS = [1, 2, 3, 4, 5]

const parseDays = (csv) => {
    if (!csv) return [...DEFAULT_DAYS]
    return String(csv).split(',').map(s => parseInt(s.trim(), 10)).filter(n => n >= 1 && n <= 7)
}

const formatDays = (arr) => {
    if (!arr || arr.length === 0) return '—'
    if (arr.length === 7) return 'Every day'
    if (arr.length === 5 && arr.every(i => i <= 5)) return 'Mon–Fri'
    if (arr.length === 2 && arr.includes(6) && arr.includes(7)) return 'Weekends'
    return [...arr].sort((a, b) => a - b).map(iso => WEEKDAYS.find(w => w.iso === iso)?.short).filter(Boolean).join(', ')
}

const emptyForm = {
    name: '', description: '', officeId: '', location: '', opensAt: '08:00', closesAt: '17:00',
    maxCapacity: 50, averageServiceMinutes: 5, allowWaitlist: true, autoPromoteWaitlist: true, maxWaitlistSize: 20,
    matricRequired: false, operatingDays: [...DEFAULT_DAYS],
}

function SelectCheckbox({ checked, onChange, disabled }) {
    return (
        <button type="button" onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!checked) }} disabled={disabled}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors disabled:opacity-50 ${checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white hover:border-brand-400 dark:border-slate-600 dark:bg-slate-900'}`}>
            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>
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
            const [queue, office] = await Promise.all([api.get('/api/admin/queues'), api.get('/api/admin/offices')])
            setQueues(queue.data.data || []); setOffices(office.data.data || [])
        } catch (err) { push({ type: 'error', message: err.message || 'Failed to load data' }) }
        finally { setLoading(false) }
    }, [push])

    useEffect(() => { load() }, [load])

    const setField = (f) => (e) => setForm({ ...form, [f]: e.target.value })
    const toggleDay = (iso) => {
        setForm((prev) => {
            const current = prev.operatingDays || []
            const next = current.includes(iso) ? current.filter((i) => i !== iso) : [...current, iso]
            return { ...prev, operatingDays: next.sort((a, b) => a - b) }
        })
    }
    const setDaysPreset = (arr) => setForm((prev) => ({ ...prev, operatingDays: [...arr] }))

    const openCreate = (prefillOfficeId = '') => {
        setForm({ ...emptyForm, officeId: prefillOfficeId })
        setEditingId(null); setShowForm(true)
        setTimeout(() => document.getElementById('queue-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }

    const openEdit = (queue) => {
        setForm({
            name: queue.name || '', description: queue.description || '', officeId: queue.officeId || '', location: queue.location || '',
            opensAt: (queue.opensAt || '08:00').slice(0, 5), closesAt: (queue.closesAt || '17:00').slice(0, 5),
            maxCapacity: queue.maxCapacity ?? 50, averageServiceMinutes: queue.averageServiceMinutes ?? 5,
            allowWaitlist: queue.allowWaitlist ?? true, autoPromoteWaitlist: queue.autoPromoteWaitlist ?? true,
            maxWaitlistSize: queue.maxWaitlistSize ?? 20, matricRequired: queue.matricRequired ?? false,
            operatingDays: parseDays(queue.operatingDays),
        })
        setEditingId(queue.id); setShowForm(true)
        setTimeout(() => document.getElementById('queue-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }

    const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm) }

    const save = async (e) => {
        e.preventDefault()
        if (!form.officeId) return push({ type: 'error', message: 'Please select an office' })
        if (!form.operatingDays || form.operatingDays.length === 0) return push({ type: 'error', message: 'Pick at least one operating day' })
        setSaving(true)
        try {
            const payload = {
                ...form, officeId: Number(form.officeId), opensAt: `${form.opensAt}:00`, closesAt: `${form.closesAt}:00`,
                maxCapacity: Number(form.maxCapacity), averageServiceMinutes: Number(form.averageServiceMinutes),
                maxWaitlistSize: Number(form.maxWaitlistSize), operatingDays: form.operatingDays.join(','),
            }
            if (editingId) { await api.put(`/api/admin/queues/${editingId}`, payload); push({ type: 'success', message: 'Service updated' }) }
            else { await api.post('/api/admin/queues', payload); push({ type: 'success', message: 'Service created' }) }
            closeForm(); await load()
        } catch (err) { push({ type: 'error', message: err.message || 'Failed to save service' }) }
        finally { setSaving(false) }
    }

    const toggleSelect = (id) => {
        setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
    }

    const handleBulk = async (action) => {
        const ids = Array.from(selectedIds)
        if (ids.length === 0) return
        setBulkBusy(true)
        try {
            const endpoint = action === 'activate' ? '/api/admin/bulk/queues/activate' : action === 'deactivate' ? '/api/admin/bulk/queues/deactivate' : '/api/admin/bulk/queues/delete'
            await api.post(endpoint, { ids })
            push({ type: 'success', message: `${ids.length} services ${action}d` })
            setBulkConfirm(null); setSelectedIds(new Set()); await load()
        } catch (err) { push({ type: 'error', message: err.message || 'Bulk action failed' }) }
        finally { setBulkBusy(false) }
    }

    const filteredQueues = useMemo(() => {
        if (!search.trim()) return queues
        const s = search.toLowerCase()
        return queues.filter(q => q.name?.toLowerCase().includes(s) || q.officeName?.toLowerCase().includes(s) || q.location?.toLowerCase().includes(s))
    }, [queues, search])

    const groups = useMemo(() => {
        const map = new Map()
        filteredQueues.forEach(q => {
            const label = (q.officeName || 'General').trim() || 'General'
            const key = label.toLowerCase()
            if (!map.has(key)) map.set(key, { key, label, queues: [] })
            map.get(key).queues.push(q)
        })
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
    }, [filteredQueues])

    const QueueCard = ({ q: queue }) => {
        const isSelected = selectedIds.has(queue.id)
        const isLive = queue.isOpen === true
        return (
            <motion.div variants={staggerItem} className="h-full">
                <Card className={`flex h-full flex-col relative transition-all group ${isSelected ? 'ring-2 ring-brand-500 border-transparent' : 'hover:shadow-md hover:border-brand-300'}`}>
                    <div className="absolute top-4 right-4 z-10">
                        <SelectCheckbox checked={isSelected} onChange={() => toggleSelect(queue.id)} />
                    </div>

                    <div className="mb-4 pr-10 pl-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{queue.name}</h3>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            {queue.isActive !== false ? <Badge variant="success" className="px-2 py-0.5 text-[10px]">Active</Badge> : <Badge variant="default" className="px-2 py-0.5 text-[10px]">Inactive</Badge>}
                            {queue.matricRequired && <Badge variant="warning" className="px-2 py-0.5 text-[10px] flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Matric</Badge>}
                        </div>
                    </div>

                    {queue.location && <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2"><MapPin className="h-3.5 w-3.5" />{queue.location}</p>}
                    {queue.description && <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400 mb-4">{queue.description}</p>}

                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Waiting</div><div className="mt-1 text-lg font-bold text-brand-600 dark:text-brand-400">{queue.waitingCount ?? 0}</div></div>
                            <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg. min</div><div className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400">{queue.averageServiceMinutes}</div></div>
                            <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Staff</div><div className="mt-1 text-lg font-bold text-sky-600 dark:text-sky-400">{queue.staffCount ?? 0}</div></div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(queue)} fullWidth>Edit</Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        )
    }

    if (loading) return <div className="space-y-6 pb-12"><SkeletonQueueGrid count={6} /></div>

    return (
        <div className="space-y-8 pb-24">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Services</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create, edit, and manage every service across your offices.</p>
                </div>
                <Button icon={Plus} onClick={() => openCreate()}>New Service</Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div id="queue-form" variants={expand} initial="initial" animate="animate" exit="exit" className="overflow-hidden">
                        <Card>
                            <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">{editingId ? 'Edit service' : 'Create service'}</h3>
                            <form onSubmit={save} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input label="Service name" value={form.name} onChange={setField('name')} placeholder="e.g. Tuition Payment" required />
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Office <span className="text-rose-500">*</span></label>
                                        <select value={form.officeId} onChange={setField('officeId')} required className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                            <option value="">Select office</option>
                                            {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </select>
                                    </div>
                                    <Input label="Location" value={form.location} onChange={setField('location')} placeholder="e.g. Block A, Room 101" icon={MapPin} />
                                    <Input label="Description" value={form.description} onChange={setField('description')} placeholder="What is this for?" />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input label="Opens at" type="time" value={form.opensAt} onChange={setField('opensAt')} />
                                    <Input label="Closes at" type="time" value={form.closesAt} onChange={setField('closesAt')} />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input label="Max capacity" type="number" min="1" value={form.maxCapacity} onChange={setField('maxCapacity')} />
                                    <Input label="Avg. service minutes" type="number" min="1" value={form.averageServiceMinutes} onChange={setField('averageServiceMinutes')} />
                                </div>
                                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                                    <input type="checkbox" checked={form.matricRequired} onChange={(e) => setForm({ ...form, matricRequired: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100"><GraduationCap className="h-3.5 w-3.5 text-slate-400" /> Matric number required</div>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Freshers must upgrade to full student access before joining.</p>
                                    </div>
                                </label>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>Cancel</Button>
                                    <Button type="submit" loading={saving} disabled={saving || offices.length === 0}>{editingId ? 'Save changes' : 'Create service'}</Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                    <Input placeholder="Search by service name, office, or location" value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} />
                </div>
                <ExportButton rows={filteredQueues} columns={[{ key: 'name', label: 'Name' }]} filename="uniqueue-services" label="Export" />
            </div>

            <div className="space-y-10">
                {groups.map((group, groupIdx) => (
                    <motion.section key={group.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: groupIdx * 0.05 }}>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-brand-600" />
                                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">{group.label}</h4>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">{group.queues.length} services</span>
                            </div>
                            <button onClick={() => openCreate(group.queues[0]?.officeId || '')} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"><Plus className="h-3.5 w-3.5" /> Add service</button>
                        </div>
                        <motion.div variants={stagger(0, 0.05)} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {group.queues.map((item) => <QueueCard key={item.id} q={item} />)}
                        </motion.div>
                    </motion.section>
                ))}
            </div>

            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                            <span className="px-2 text-sm font-bold text-slate-900 dark:text-slate-100">{selectedIds.size} selected</span>
                            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
                            <button onClick={() => handleBulk('activate')} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"><Power className="h-3.5 w-3.5" /> Activate</button>
                            <button onClick={() => handleBulk('deactivate')} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"><PowerOff className="h-3.5 w-3.5" /> Deactivate</button>
                            <button onClick={() => handleBulk('delete')} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                            <button onClick={() => setSelectedIds(new Set())} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><CloseIcon className="h-4 w-4" /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}