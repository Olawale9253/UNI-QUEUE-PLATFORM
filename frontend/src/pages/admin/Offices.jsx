import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, MapPin, Users, ListOrdered, Search, X as CloseIcon, Ticket, Pencil,
    Plus, ArrowRight, Trash2, PlayCircle, PauseCircle, CheckSquare, Square
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ExportButton from '../../components/ui/ExportButton'
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import OfficeFormModal from '../../components/admin/OfficeFormModal'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem } from '../../lib/motion'

function OfficeCard({ office, onEdit, onOpen, onDelete, isSelected, onToggleSelect }) {
    return (
        <motion.div variants={staggerItem} className="h-full">
            <Card className={`flex h-full flex-col relative transition-all group ${isSelected ? 'ring-2 ring-brand-500 border-transparent' : 'hover:shadow-md hover:border-brand-300'}`}>

                {/* Selection Checkbox */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(office.id) }}
                    className="absolute left-4 top-4 z-10 text-slate-400 hover:text-brand-600 transition-colors"
                >
                    {isSelected ? <CheckSquare className="h-5 w-5 text-brand-600" /> : <Square className="h-5 w-5" />}
                </button>

                {/* Top Actions */}
                <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" title="Edit office">
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={onDelete} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40" title="Delete office">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>

                <div className="mb-3 flex items-start gap-3 pl-10 pr-16">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                        <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="min-w-0 mt-1">
                        <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{office.name}</h3>
                        {office.location && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                                <MapPin className="h-3 w-3 shrink-0" /> {office.location}
                            </p>
                        )}
                    </div>
                </div>

                <div className="pl-10 pr-4">
                    {office.description ? (
                        <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{office.description}</p>
                    ) : (
                        <p className="text-sm italic text-slate-400">No description</p>
                    )}
                </div>

                <div className="mt-auto pt-6 pl-10 pr-4">
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <div>
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <ListOrdered className="h-3 w-3" /> Services
                            </div>
                            <div className="mt-1 text-base font-bold text-brand-600 dark:text-brand-400">{office.serviceCount ?? 0}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <Users className="h-3 w-3" /> Staff
                            </div>
                            <div className="mt-1 text-base font-bold text-sky-600 dark:text-sky-400">{office.staffCount ?? 0}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <Ticket className="h-3 w-3" /> Waiting
                            </div>
                            <div className="mt-1 text-base font-bold text-amber-600 dark:text-amber-400">{office.waitingCount ?? 0}</div>
                        </div>
                    </div>

                    <button onClick={onOpen} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        View services <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </Card>
        </motion.div>
    )
}

function OfficeDetail({ office, queues, onClose }) {
    const navigate = useNavigate()
    const services = queues.filter((queue) => queue.officeId === office.id)

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()} className="relative my-8 w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                    <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                        <CloseIcon className="h-4 w-4" />
                    </button>

                    <div className="flex items-start gap-3 pr-8">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                            <Building2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">{office.name}</h2>
                            {office.location && <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400"><MapPin className="h-3.5 w-3.5 shrink-0" />{office.location}</p>}
                            {office.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{office.description}</p>}
                        </div>
                        <Link to="/admin/queues">
                            <Button variant="secondary" icon={Pencil} className="shrink-0">Manage services</Button>
                        </Link>
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Services in this office</h3>
                        {services.length === 0 ? (
                            <EmptyState icon={ListOrdered} variant="info" size="sm" title="No services yet" description="Add services to this office so students can join them." action={<Button icon={Plus} size="sm" onClick={() => navigate('/admin/queues')}>Create service</Button>} />
                        ) : (
                            <div className="space-y-3">
                                {services.map((service) => (
                                    <div key={service.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{service.name}</h4>
                                                {service.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{service.description}</p>}
                                            </div>
                                            <Badge variant={service.isActive ? 'success' : 'default'}>{service.isActive ? 'Active' : 'Inactive'}</Badge>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                            <span className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400"><Users className="h-3 w-3" /> {service.waitingCount ?? 0} waiting</span>
                                            <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400"><Ticket className="h-3 w-3" /> ~{service.estimatedMinutes ?? 0} min</span>
                                            {service.staffCount > 0 && <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400"><Users className="h-3 w-3" /> {service.staffCount} staff</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
                </motion.div>
            </div>
        </>
    )
}

export default function Offices() {
    const { push } = useToastStore()
    const [offices, setOffices] = useState([])
    const [queues, setQueues] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editTarget, setEditTarget] = useState(null)
    const [openOffice, setOpenOffice] = useState(null)

    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const [selectedIds, setSelectedIds] = useState([])
    const [bulkLoading, setBulkLoading] = useState(false)

    const load = async () => {
        try {
            const [office, queue] = await Promise.all([
                api.get(`/api/admin/offices?t=${Date.now()}`),
                api.get(`/api/admin/queues?t=${Date.now()}`),
            ])
            setOffices(office.data?.data || [])
            setQueues(queue.data?.data || [])
            setSelectedIds([])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load offices' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const filtered = useMemo(() => {
        if (!search.trim()) return offices
        const s = search.toLowerCase()
        return offices.filter(o => o.name.toLowerCase().includes(s) || o.location?.toLowerCase().includes(s))
    }, [offices, search])

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    const toggleSelectAll = () => setSelectedIds(selectedIds.length === filtered.length && filtered.length > 0 ? [] : filtered.map(o => o.id))

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/admin/offices/${deleteTarget.id}`)
            push({ type: 'success', message: 'Office deleted successfully' })
            setDeleteTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to delete office' })
        } finally {
            setDeleting(false)
        }
    }

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return
        setBulkLoading(true)
        try {
            if (action === 'delete') {
                await Promise.all(selectedIds.map(id => api.delete(`/api/admin/offices/${id}`)))
                push({ type: 'success', message: `${selectedIds.length} office(s) deleted` })
            } else {
                const isActive = action === 'activate'
                await Promise.all(selectedIds.map(id => {
                    const office = offices.find(o => o.id === id)
                    return api.put(`/api/admin/offices/${id}`, { ...office, isActive })
                }))
                push({ type: 'success', message: `${selectedIds.length} office(s) ${isActive ? 'activated' : 'deactivated'}` })
            }
            load()
        } catch (err) {
            push({ type: 'error', message: `Failed to ${action} offices` })
        } finally {
            setBulkLoading(false)
        }
    }

    if (loading) return <div className="space-y-6 pb-24"><SkeletonQueueGrid count={6} /></div>

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Offices</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage the physical locations that host your services.</p>
                </div>
                <Button icon={Plus} onClick={() => { setEditTarget(null); setShowModal(true) }}>New Office</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="h-4 w-4 text-brand-600" /> : <Square className="h-4 w-4" />} Select All
                </button>
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search offices..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
                <ExportButton rows={filtered} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }]} filename="uniqueue-offices" label="Export" />
            </div>

            {offices.length === 0 ? <EmptyState icon={Building2} title="No offices yet" description="Create your first office." action={<Button onClick={() => setShowModal(true)}>Create office</Button>} /> : filtered.length === 0 ? <EmptyState icon={Search} title="No matches" description="Try a different search." action={<Button onClick={() => setSearch('')}>Clear search</Button>} /> : (
                <motion.div variants={stagger(0, 0.05)} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(item => (
                        <OfficeCard
                            key={item.id}
                            office={item}
                            isSelected={selectedIds.includes(item.id)}
                            onToggleSelect={toggleSelect}
                            onEdit={() => { setEditTarget(item); setShowModal(true) }}
                            onDelete={() => setDeleteTarget(item)}
                            onOpen={() => setOpenOffice(item)}
                        />
                    ))}
                </motion.div>
            )}

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                        <div className="px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">{selectedIds.length} selected</div>
                        <button onClick={() => handleBulkAction('activate')} disabled={bulkLoading} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"><PlayCircle className="h-4 w-4" /> Activate</button>
                        <button onClick={() => handleBulkAction('deactivate')} disabled={bulkLoading} className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"><PauseCircle className="h-4 w-4" /> Deactivate</button>
                        <button onClick={() => handleBulkAction('delete')} disabled={bulkLoading} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"><Trash2 className="h-4 w-4" /> Delete</button>
                        <button onClick={() => setSelectedIds([])} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><CloseIcon className="h-4 w-4" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmDialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} onConfirm={handleDelete} title={`Delete "${deleteTarget?.name}"?`} description="This will permanently remove the office." confirmLabel="Delete office" variant="danger" loading={deleting} />

            <AnimatePresence>
                {showModal && <OfficeFormModal office={editTarget} onClose={() => setShowModal(false)} onSaved={load} onDeleted={load} />}
            </AnimatePresence>
            <AnimatePresence>
                {openOffice && <OfficeDetail office={openOffice} queues={queues} onClose={() => setOpenOffice(null)} />}
            </AnimatePresence>
        </div>
    )
}