import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Mail, Phone, Building2, X as CloseIcon, Users, Link as LinkIcon, Search, Check } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ExportButton from '../../components/ui/ExportButton'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem, expand } from '../../lib/motion'

const initialForm = { fullName: '', email: '', password: '', department: '', phone: '' }

function SelectCheckbox({ checked, onChange, disabled }) {
    return (
        <button type="button" onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!checked) }} disabled={disabled}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors disabled:opacity-50 ${checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white hover:border-brand-400 dark:border-slate-600 dark:bg-slate-900'}`}>
            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>
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
            const [s, q] = await Promise.all([api.get('/api/admin/staff'), api.get('/api/admin/queues')])
            setStaff(s.data.data || []); setQueues(q.data.data || [])
        } catch (err) { push({ type: 'error', message: err.message || 'Failed to load' }) }
        finally { setLoading(false) }
    }, [push])

    useEffect(() => { load() }, [load])

    const setField = (f) => (e) => setForm({ ...form, [f]: e.target.value })

    const createStaff = async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
            await api.post('/api/admin/staff', form)
            push({ type: 'success', message: 'Staff member added successfully' })
            setForm(initialForm)
            setShowCreate(false)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to create staff' })
        } finally {
            setCreating(false)
        }
    }

    const assignToQueue = async (queueId) => {
        if (!assignTarget) return
        setAssigning(true)
        try {
            await api.post(`/api/admin/queues/${queueId}/staff/${assignTarget.id}`); push({ type: 'success', message: 'Assigned' }); await load()
        } catch (err) { push({ type: 'error', message: err.message || 'Failed to assign' }) }
        finally { setAssigning(false) }
    }

    const unassignFromQueue = async (queueId, staffId) => {
        try {
            await api.delete(`/api/admin/queues/${queueId}/staff/${staffId}`); push({ type: 'success', message: 'Removed' }); await load()
        } catch (err) { push({ type: 'error', message: err.message || 'Failed to unassign' }) }
    }

    const toggleSelect = (id) => setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

    const assignmentsByStaff = new Map()
    queues.forEach(q => { (q.staff || []).forEach(s => { if (!assignmentsByStaff.has(s.id)) assignmentsByStaff.set(s.id, []); assignmentsByStaff.get(s.id).push({ queueId: q.id, queueName: q.name }) }) })

    const filteredStaff = staff.filter(item => {
        if (!search.trim()) return true
        const s = search.toLowerCase()
        return item.fullName?.toLowerCase().includes(s) || item.email?.toLowerCase().includes(s) || item.department?.toLowerCase().includes(s)
    })

    if (loading) return <div className="space-y-6 pb-24"><SkeletonCard /><SkeletonCard /></div>

    return (
        <div className="space-y-8 pb-24">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Staff Management</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add staff and manage their service assignments.</p>
                </div>
                <Button icon={Plus} onClick={() => setShowCreate(true)}>Add Staff</Button>
            </div>

            <AnimatePresence>
                {showCreate && (
                    <motion.div variants={expand} initial="initial" animate="animate" exit="exit" className="overflow-hidden">
                        <Card>
                            <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">Add a new staff member</h3>
                            <form onSubmit={createStaff} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input label="Full name" value={form.fullName} onChange={setField('fullName')} placeholder="Jane Doe" required />
                                <Input label="Email" type="email" value={form.email} onChange={setField('email')} placeholder="jane.staff@university.edu.ng" required />
                                <Input label="Password" type="password" value={form.password} onChange={setField('password')} placeholder="At least 8 characters" required />
                                <Input label="Department" value={form.department} onChange={setField('department')} placeholder="e.g. Bursary" icon={Building2} />
                                <Input label="Phone" value={form.phone} onChange={setField('phone')} placeholder="e.g. 08012345678" icon={Phone} />
                                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                                    <Button type="submit" loading={creating} disabled={creating}>Create staff account</Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                    <Input placeholder="Search by name, email, or department..." value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} />
                </div>
                <ExportButton rows={filteredStaff} columns={[{ key: 'fullName', label: 'Name' }, { key: 'email', label: 'Email' }]} filename="uniqueue-staff" label="Export" />
            </div>

            {staff.length === 0 ? <EmptyState icon={Users} title="No staff members yet" description="Add your first staff member to begin." action={<Button onClick={() => setShowCreate(true)}>Add staff</Button>} /> : filteredStaff.length === 0 ? <EmptyState icon={Search} title="No matches" description="Try a different search." action={<Button onClick={() => setSearch('')}>Clear search</Button>} /> : (
                <motion.div variants={stagger(0, 0.05)} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredStaff.map(item => {
                        const assigned = assignmentsByStaff.get(item.id) || []
                        const isSelected = selectedIds.has(item.id)
                        return (
                            <motion.div key={item.id} variants={staggerItem}>
                                <Card className={`flex h-full flex-col relative transition-all group ${isSelected ? 'ring-2 ring-brand-500 border-transparent' : 'hover:shadow-md'}`}>
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex gap-3 items-center">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm">
                                                {item.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.fullName}</h3>
                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" />{item.email}</div>
                                            </div>
                                        </div>
                                        <SelectCheckbox checked={isSelected} onChange={() => toggleSelect(item.id)} />
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-2 flex-1 content-start">
                                        {assigned.length === 0 ? <span className="text-xs font-medium text-slate-400">Not assigned to any service</span> : assigned.map(a => (
                                            <span key={a.queueId} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {a.queueName}
                                                <button onClick={() => unassignFromQueue(a.queueId, item.id)} className="rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"><CloseIcon className="h-3 w-3" /></button>
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                        <Button size="sm" variant="secondary" icon={LinkIcon} onClick={() => setAssignTarget(item)}>Assign</Button>
                                        <button onClick={() => setDeleteTarget(item)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </motion.div>
            )}
        </div>
    )
}