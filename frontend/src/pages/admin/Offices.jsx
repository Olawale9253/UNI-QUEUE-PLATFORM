import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2,
    MapPin,
    Clock,
    Users,
    ListOrdered,
    Search,
    X,
    Ticket,
    ArrowRight,
    Pencil,
    Mail,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem } from '../../lib/motion'

function OfficeCard({ office, onClick }) {
    return (
        <motion.div variants={staggerItem}>
            <button
                type="button"
                onClick={onClick}
                className="group block h-full w-full text-left transition-transform hover:-translate-y-0.5"
            >
                <Card className="flex h-full flex-col">
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
                                <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                                    {office.department}
                                </h3>
                                {office.location && (
                                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        {office.location}
                                    </p>
                                )}
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <div>
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                <ListOrdered className="h-3 w-3" />
                                Queues
                            </div>
                            <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                                {office.queueCount}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                <Users className="h-3 w-3" />
                                Staff
                            </div>
                            <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                                {office.staffCount}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                <Ticket className="h-3 w-3" />
                                Waiting
                            </div>
                            <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                                {office.waitingTotal}
                            </div>
                        </div>
                    </div>
                </Card>
            </button>
        </motion.div>
    )
}

function OfficeDetail({ office, onClose }) {
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative my-8 w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="flex items-start gap-3 pr-8">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                            <Building2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {office.department}
                            </h2>
                            {office.location && (
                                <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-500 dark:text-slate-400">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    {office.location}
                                </p>
                            )}
                        </div>
                        <Link to="/admin/queues">
                            <Button variant="secondary" icon={Pencil} className="shrink-0">
                                Manage queues
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Queues in this office
                        </h3>
                        <div className="space-y-3">
                            {office.queues.map((q) => (
                                <div
                                    key={q.id}
                                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {q.name}
                                            </h4>
                                            {q.location && (
                                                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <MapPin className="h-3 w-3" />
                                                    {q.location}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant={q.isActive ? 'success' : 'default'}>
                                            {q.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                        {q.waitingCount ?? 0} waiting
                    </span>
                                        <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{q.estimatedMinutes ?? 0} min
                    </span>
                                        {q.opensAt && q.closesAt && (
                                            <span>
                        {String(q.opensAt).slice(0, 5)} – {String(q.closesAt).slice(0, 5)}
                      </span>
                                        )}
                                    </div>

                                    {/* Staff with emails for admin */}
                                    {q.staff && q.staff.length > 0 ? (
                                        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                                            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Assigned staff
                                            </div>
                                            <div className="space-y-1.5">
                                                {q.staff.map((s) => (
                                                    <div
                                                        key={s.id}
                                                        className="flex items-center gap-2 text-xs"
                                                    >
                                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                                                            {s.fullName?.slice(0, 1).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                                                                {s.fullName}
                                                            </div>
                                                            <div className="flex items-center gap-1 truncate text-slate-500 dark:text-slate-400">
                                                                <Mail className="h-3 w-3 shrink-0" />
                                                                {s.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
                                            No staff assigned yet.{' '}
                                            <Link
                                                to="/admin/staff"
                                                className="font-medium text-brand-600 hover:underline"
                                            >
                                                Assign staff
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button variant="secondary" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </motion.div>
            </div>
        </>
    )
}

export default function Offices() {
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [openOffice, setOpenOffice] = useState(null)

    useEffect(() => {
        let cancelled = false
        api
            .get('/api/admin/queues')
            .then((res) => {
                if (!cancelled) setQueues(res.data?.data || [])
            })
            .catch((err) => {
                if (!cancelled)
                    push({
                        type: 'error',
                        message: err.response?.data?.message || 'Failed to load offices',
                    })
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [push])

    const offices = useMemo(() => {
        const map = new Map()
        for (const q of queues) {
            const dept = (q.department || '').trim()
            const key = dept || '__other__'
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    department: dept || 'Unassigned queues',
                    location: q.location || '',
                    queues: [],
                    queueCount: 0,
                    staffCount: 0,
                    waitingTotal: 0,
                    _staffIds: new Set(),
                })
            }
            const o = map.get(key)
            o.queues.push(q)
            o.queueCount += 1
            o.waitingTotal += q.waitingCount ?? 0
            if (!o.location && q.location) o.location = q.location
            ;(q.staff || []).forEach((s) => o._staffIds.add(s.id))
        }
        const arr = Array.from(map.values())
        arr.forEach((o) => {
            o.staffCount = o._staffIds.size
            delete o._staffIds
        })
        return arr.sort((a, b) => a.department.localeCompare(b.department))
    }, [queues])

    const filtered = useMemo(() => {
        if (!search.trim()) return offices
        const s = search.toLowerCase()
        return offices.filter(
            (o) =>
                o.department.toLowerCase().includes(s) ||
                o.location?.toLowerCase().includes(s) ||
                o.queues.some((q) => q.name.toLowerCase().includes(s))
        )
    }, [offices, search])

    if (loading) {
        return (
            <>
                <PageHeader
                    title="Offices"
                    description="Browse every office and its assigned staff."
                />
                <SkeletonQueueGrid count={6} />
            </>
        )
    }

    return (
        <>
            <PageHeader
                title="Offices"
                description="Browse every office, its queues, and its assigned staff."
                action={
                    <Link to="/admin/queues">
                        <Button icon={Pencil}>Manage queues</Button>
                    </Link>
                }
            />

            {queues.length > 0 && (
                <div className="mb-5">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search offices or queues"
                            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                    </div>
                </div>
            )}

            {offices.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="No offices yet"
                    description="Create queues with departments to organise them into offices."
                    action={
                        <Link to="/admin/queues">
                            <Button icon={Pencil}>Go to queues</Button>
                        </Link>
                    }
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No matches"
                    description="Try a different search term."
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
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {filtered.map((o) => (
                        <OfficeCard key={o.key} office={o} onClick={() => setOpenOffice(o)} />
                    ))}
                </motion.div>
            )}

            <AnimatePresence>
                {openOffice && (
                    <OfficeDetail office={openOffice} onClose={() => setOpenOffice(null)} />
                )}
            </AnimatePresence>
        </>
    )
}