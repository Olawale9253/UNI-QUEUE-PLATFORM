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

// (Keep all the WEEKDAYS, parseDays, formatDays, emptyForm, and SelectCheckbox exactly as they were)

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

    // (Keep all the load, setField, toggleDay, openCreate, openEdit, save, and deleteQueue logic)

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
                            {queue.isActive !== false ? (
                                <Badge variant="success" className="px-2 py-0.5 text-[10px]">Active</Badge>
                            ) : (
                                <Badge variant="default" className="px-2 py-0.5 text-[10px]">Inactive</Badge>
                            )}
                            {queue.matricRequired && (
                                <Badge variant="warning" className="px-2 py-0.5 text-[10px] flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Matric</Badge>
                            )}
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

            <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                    <Input placeholder="Search by service name, office, or location" value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} />
                </div>
                <ExportButton rows={filteredQueues} columns={[{ key: 'name', label: 'Name' }]} filename="uniqueue-services" label="Export" />
            </div>

            {/* Render the groups and cards */}
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
        </div>
    )
}