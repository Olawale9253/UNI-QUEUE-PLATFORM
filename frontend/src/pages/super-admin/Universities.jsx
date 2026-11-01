import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, Search, Pencil, CheckCircle2, XCircle, Trash2,
    Power, PowerOff, MoreHorizontal
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import UniversityDetailsModal from './UniversityDetailsModal'

export default function Universities() {
    const { push } = useToastStore()
    const [universities, setUniversities] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [editingUni, setEditingUni] = useState(null)

    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [togglingId, setTogglingId] = useState(null)

    const load = async () => {
        try {
            const res = await api.get(`/api/super-admin/universities?t=${Date.now()}`)
            setUniversities(res.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: 'Failed to load universities' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [push])

    const filtered = universities.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.code?.toLowerCase().includes(search.toLowerCase())
    )

    const total = universities.length
    const active = universities.filter(u => u.isActive).length
    const inactive = total - active

    const STATS = [
        { label: 'Total', value: total, icon: Building2, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950/40' },
        { label: 'Active', value: active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
        { label: 'Inactive', value: inactive, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40' },
    ]

    const handleToggleActive = async (uni) => {
        setTogglingId(uni.id)
        try {
            const endpoint = uni.isActive
                ? `/api/super-admin/universities/${uni.id}/deactivate`
                : `/api/super-admin/universities/${uni.id}/reactivate`

            await api.post(endpoint)
            push({ type: 'success', message: `University ${uni.isActive ? 'deactivated' : 'reactivated'}` })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to update status' })
        } finally {
            setTogglingId(null)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/super-admin/universities/${deleteTarget.id}`)
            push({ type: 'success', message: `${deleteTarget.name} deleted successfully` })
            setDeleteTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to delete university' })
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 pb-12 px-4 sm:px-6">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 sm:h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}
                </div>
                <Card padded={false}>{[1, 2, 3].map(i => <SkeletonRow key={i} />)}</Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12 px-4 sm:px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Universities</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage all registered institutions on the platform.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {STATS.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-5 gap-2 sm:gap-0">
                            <div>
                                <p className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                                <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{stat.value}</p>
                            </div>
                            <div className={`flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Card padded={false}>
                <div className="border-b border-slate-100 p-3 sm:p-4 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="w-full sm:max-w-sm">
                        <Input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="No universities found"
                        description={search ? "No universities match your search." : "There are no universities on the platform yet."}
                        action={search ? <button onClick={() => setSearch('')} className="text-brand-600 text-sm font-semibold">Clear search</button> : undefined}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[700px]">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/50">
                            <tr>
                                <th className="whitespace-nowrap px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Institution</th>
                                <th className="whitespace-nowrap px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Code</th>
                                <th className="whitespace-nowrap px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Plan</th>
                                <th className="whitespace-nowrap px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                <th className="whitespace-nowrap px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map((uni) => (
                                <tr key={uni.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-sm dark:bg-slate-800 dark:ring-slate-700">
                                                {uni.logoUrl ? <img src={uni.logoUrl} alt={uni.name} className="h-full w-full object-contain p-1" /> : <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[150px]">{uni.name}</div>
                                                <div className="truncate text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-[120px]">{uni.emailDomain ? `@${uni.emailDomain}` : 'No domain restriction'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 sm:py-1 font-mono text-[10px] sm:text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{uni.code || '—'}</span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4"><Badge variant="default" className="text-[9px] sm:text-xs">{uni.plan || 'FREE'}</Badge></td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4"><Badge variant={uni.isActive ? 'success' : 'danger'} className="text-[9px] sm:text-xs">{uni.isActive ? 'Active' : 'Inactive'}</Badge></td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                                        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                            <button onClick={() => setEditingUni(uni)} title="Manage Details" className="rounded-lg p-1.5 sm:p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-400">
                                                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </button>
                                            <button onClick={() => handleToggleActive(uni)} disabled={togglingId === uni.id} title={uni.isActive ? 'Deactivate University' : 'Activate University'} className={`rounded-lg p-1.5 sm:p-2 transition-colors disabled:opacity-50 ${uni.isActive ? 'text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40'}`}>
                                                {togglingId === uni.id ? <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> : uni.isActive ? <PowerOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Power className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                                            </button>
                                            <button onClick={() => setDeleteTarget(uni)} title="Delete University" className="rounded-lg p-1.5 sm:p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400">
                                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <AnimatePresence>
                {editingUni && <UniversityDetailsModal university={editingUni} onClose={() => setEditingUni(null)} onSaved={load} />}
            </AnimatePresence>

            <ConfirmDialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} onConfirm={handleDelete} title={`Delete ${deleteTarget?.name}?`} description="This will permanently remove the university, all its users, queues, and historical data. This action cannot be undone." confirmLabel="Delete University" variant="danger" loading={deleting} />
        </div>
    )
}