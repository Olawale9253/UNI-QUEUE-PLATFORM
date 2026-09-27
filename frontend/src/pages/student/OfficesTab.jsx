import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, MapPin, Clock, Users, ListOrdered, Search, X, Ticket, ArrowRight,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem } from '../../lib/motion'

function OfficeCard({ office, queueCount, staffCount, waitingTotal, onClick }) {
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
                                    {office.name}
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

                    {office.description && (
                        <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                            {office.description}
                        </p>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <div>
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                <ListOrdered className="h-3 w-3" /> Services
                            </div>
                            <div className="mt-1 text-base font-bold text-brand-600 dark:text-brand-400">
                                {queueCount}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                <Users className="h-3 w-3" /> Staff
                            </div>
                            <div className="mt-1 text-base font-bold text-sky-600 dark:text-sky-400">
                                {staffCount}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                <Ticket className="h-3 w-3" /> Waiting
                            </div>
                            <div className="mt-1 text-base font-bold text-amber-600 dark:text-amber-400">
                                {waitingTotal}
                            </div>
                        </div>
                    </div>
                </Card>
            </button>
        </motion.div>
    )
}

function OfficeDetail({ office, queues, onClose }) {
    const services = queues.filter((q) => q.officeId === office.id)

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
                    className="relative my-8 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
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
                        <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {office.name}
                            </h2>
                            {office.location && (
                                <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-500 dark:text-slate-400">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    {office.location}
                                </p>
                            )}
                            {office.description && (
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                    {office.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Services
                        </h3>

                        {services.length === 0 ? (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No services yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {services.map((q) => (
                                    <div
                                        key={q.id}
                                        className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {q.name}
                                                </h4>
                                                {q.description && (
                                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                                        {q.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant={q.isActive ? 'success' : 'default'}>
                                                {q.isActive ? 'Open' : 'Closed'}
                                            </Badge>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400">
                        <Users className="h-3 w-3" />
                          {q.waitingCount ?? 0} waiting
                      </span>
                                            <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        ~{q.estimatedMinutes ?? 0} min
                      </span>
                                            {q.opensAt && q.closesAt && (
                                                <span className="text-slate-500 dark:text-slate-400">
                          {String(q.opensAt).slice(0, 5)} – {String(q.closesAt).slice(0, 5)}
                        </span>
                                            )}
                                        </div>

                                        {q.staff && q.staff.length > 0 && (
                                            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                                                <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Staff
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {q.staff.map((s) => (
                                                        <span
                                                            key={s.id}
                                                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                        >
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[8px] font-bold text-white">
                                {s.fullName?.slice(0, 1).toUpperCase()}
                              </span>
                                                            {s.fullName}
                            </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                    </div>
                </motion.div>
            </div>
        </>
    )
}

export default function OfficesTab() {
    const { push } = useToastStore()
    const [offices, setOffices] = useState([])
    const [queues, setQueues] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [openOffice, setOpenOffice] = useState(null)

    useEffect(() => {
        let cancelled = false
        Promise.all([
            api.get('/api/queues'),
            // Try the admin offices endpoint — if it fails (student), fall back to queue-derived list
            api.get('/api/admin/offices').catch(() => ({ data: { data: [] } })),
        ])
            .then(([qRes, oRes]) => {
                if (cancelled) return
                const qs = qRes.data?.data || []
                const os = oRes.data?.data || []

                // If no offices loaded (student can't hit admin endpoint),
                // derive a synthetic list from the queues themselves
                if (os.length === 0) {
                    const map = new Map()
                    qs.forEach((q) => {
                        const key = q.officeId ? String(q.officeId) : (q.officeName || '__other__')
                        if (!map.has(key)) {
                            map.set(key, {
                                id: q.officeId || key,
                                name: q.officeName || 'Other services',
                                location: q.officeLocation || '',
                                description: null,
                                isActive: true,
                            })
                        }
                    })
                    setOffices(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)))
                } else {
                    setOffices(os)
                }
                setQueues(qs)
            })
            .catch((err) => {
                if (!cancelled) push({ type: 'error', message: err.response?.data?.message || 'Failed to load' })
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [push])

    const enriched = useMemo(() => {
        return offices.map((o) => {
            const services = queues.filter((q) => {
                if (q.officeId && o.id) return String(q.officeId) === String(o.id)
                return q.officeName === o.name
            })
            const staffIds = new Set()
            let waitingTotal = 0
            services.forEach((q) => {
                waitingTotal += q.waitingCount ?? 0
                ;(q.staff || []).forEach((s) => staffIds.add(s.id))
            })
            return {
                office: o,
                queueCount: services.length,
                staffCount: staffIds.size,
                waitingTotal,
            }
        })
    }, [offices, queues])

    const filtered = useMemo(() => {
        if (!search.trim()) return enriched
        const s = search.toLowerCase()
        return enriched.filter(
            (e) =>
                e.office.name.toLowerCase().includes(s) ||
                e.office.location?.toLowerCase().includes(s)
        )
    }, [enriched, search])

    if (loading) return <SkeletonQueueGrid count={6} />

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Office directory
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Browse every office at your university — see what they do and who's serving.
                </p>
            </div>

            {enriched.length > 0 && (
                <div className="mb-5">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search offices"
                            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                    </div>
                </div>
            )}

            {enriched.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="No offices available"
                    description="Your university hasn't opened any offices or services yet."
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No matches"
                    description="Try a different search term."
                    action={<Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button>}
                />
            ) : (
                <motion.div
                    variants={stagger(0, 0.05)}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {filtered.map((e) => (
                        <OfficeCard
                            key={String(e.office.id)}
                            office={e.office}
                            queueCount={e.queueCount}
                            staffCount={e.staffCount}
                            waitingTotal={e.waitingTotal}
                            onClick={() => setOpenOffice(e.office)}
                        />
                    ))}
                </motion.div>
            )}

            <AnimatePresence>
                {openOffice && (
                    <OfficeDetail office={openOffice} queues={queues} onClose={() => setOpenOffice(null)} />
                )}
            </AnimatePresence>
        </div>
    )
}