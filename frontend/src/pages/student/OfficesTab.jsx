import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Building2, MapPin, Clock, Users, ListOrdered, Search, Ticket,
    ArrowRight, GraduationCap, Mail, UserCircle2,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

function formatTime(t) {
    if (!t) return null
    return String(t).slice(0, 5)
}

export default function OfficesTab() {
    const { push } = useToastStore()
    const { user } = useAuthStore()
    const navigate = useNavigate()

    const [offices, setOffices] = useState([])
    const [queues, setQueues] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedOfficeId, setSelectedOfficeId] = useState(null)

    const isFresher = user?.role === 'FRESHER'

    const load = useCallback(async () => {
        try {
            const [qRes, oRes] = await Promise.all([
                api.get('/api/queues'),
                api.get('/api/offices').catch(() => ({ data: { data: [] } })),
            ])
            const qs = qRes.data?.data || []
            const os = oRes.data?.data || []

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
                            openingTime: null,
                            closingTime: null,
                            slotDurationMinutes: null,
                        })
                    }
                })
                setOffices(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)))
            } else {
                setOffices(os)
            }
            setQueues(qs)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load offices' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    const enriched = useMemo(() => {
        return offices.map((o) => {
            const services = queues.filter((q) => {
                if (q.officeId && o.id) return String(q.officeId) === String(o.id)
                return q.officeName === o.name
            })
            const staffMap = new Map()
            let waitingTotal = 0
            services.forEach((q) => {
                waitingTotal += q.waitingCount ?? 0
                ;(q.staff || []).forEach((s) => {
                    if (!staffMap.has(s.id)) staffMap.set(s.id, s)
                })
            })
            return { office: o, services, staff: Array.from(staffMap.values()), waitingTotal }
        })
    }, [offices, queues])

    const filtered = useMemo(() => {
        if (!search.trim()) return enriched
        const s = search.toLowerCase()
        return enriched.filter(
            (e) =>
                e.office.name.toLowerCase().includes(s) ||
                e.office.location?.toLowerCase().includes(s) ||
                e.services.some((q) => q.name.toLowerCase().includes(s))
        )
    }, [enriched, search])

    const selected = filtered.find(
        (e) => String(e.office.id ?? e.office.name) === String(selectedOfficeId)
    )

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
                <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
        )
    }

    return (
        <div>
            <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Offices
                </h2>
            </div>

            {isFresher && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
                >
                    <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                    <div className="flex-1 text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-200">
                            You're registered as a fresher
                        </p>
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                            Some services require a matric number. Upgrade from your profile when you have one.
                        </p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
                        >
                            Go to profile
                            <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                </motion.div>
            )}

            {offices.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="No offices available"
                    description="Your university hasn't opened any offices yet."
                />
            ) : (
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
                    <div className="lg:sticky lg:top-[150px]">
                        <Card className="h-fit">
                            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                                All Offices
                            </h3>

                            <div className="relative mb-4">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search offices"
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                                />
                            </div>

                            {filtered.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                                    No offices match your search.
                                </div>
                            ) : (
                                <ul className="space-y-1">
                                    {filtered.map((e) => {
                                        const id = e.office.id ?? e.office.name
                                        const isSelected = String(id) === String(selectedOfficeId)
                                        return (
                                            <li key={String(id)}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOfficeId(id)}
                                                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                                        isSelected
                                                            ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                                                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <span className="truncate">{e.office.name}</span>
                                                    <span
                                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            isSelected
                                                                ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                    >
                            {e.services.length}
                          </span>
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </Card>
                    </div>

                    {selected ? (
                        <Card>
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                                        <Building2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                            {selected.office.name}
                                        </h3>
                                        {selected.office.location && (
                                            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                {selected.office.location}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Badge variant={selected.office.isActive === false ? 'default' : 'success'}>
                                    {selected.office.isActive === false ? 'Inactive' : 'Active'}
                                </Badge>
                            </div>

                            {selected.office.description && (
                                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                                    {selected.office.description}
                                </p>
                            )}

                            <div className="mt-5 grid grid-cols-2 gap-4">
                                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                        Working hours
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        {selected.office.openingTime && selected.office.closingTime ? (
                                            <>
                                                {formatTime(selected.office.openingTime)} –{' '}
                                                {formatTime(selected.office.closingTime)}
                                            </>
                                        ) : (
                                            <span className="font-normal italic text-slate-400 dark:text-slate-500">
                        Not set
                      </span>
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                        Slot duration
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        {selected.office.slotDurationMinutes ? (
                                            <>{selected.office.slotDurationMinutes} minutes</>
                                        ) : (
                                            <span className="font-normal italic text-slate-400 dark:text-slate-500">
                        Not set
                      </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-4">
                                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                        <ListOrdered className="h-3 w-3" />
                                        Services
                                    </div>
                                    <div className="mt-1 text-xl font-bold text-brand-600 dark:text-brand-400">
                                        {selected.services.length}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                        <Users className="h-3 w-3" />
                                        Staff
                                    </div>
                                    <div className="mt-1 text-xl font-bold text-sky-600 dark:text-sky-400">
                                        {selected.staff.length}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                        <Ticket className="h-3 w-3" />
                                        Waiting
                                    </div>
                                    <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
                                        {selected.waitingTotal}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Services
                                </h4>

                                {selected.services.length === 0 ? (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                        No services yet.
                                    </div>
                                ) : (
                                    <div className="max-h-[420px] overflow-y-auto pr-1">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {selected.services.map((q) => (
                                                <div
                                                    key={q.id}
                                                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h5 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                            {q.name}
                                                        </h5>
                                                        {q.matricRequired && (
                                                            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                                        )}
                                                    </div>

                                                    {q.description ? (
                                                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                                            {q.description}
                                                        </p>
                                                    ) : (
                                                        <p className="mt-1 text-xs italic text-slate-400 dark:text-slate-500">
                                                            No description
                                                        </p>
                                                    )}

                                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            <span className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400">
                              <Users className="h-3 w-3" />
                                {q.waitingCount ?? 0} waiting
                            </span>
                                                        <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3" />
                              ~{q.estimatedMinutes ?? 0} min
                            </span>
                                                    </div>

                                                    <button
                                                        onClick={() => navigate('/student/queues')}
                                                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
                                                    >
                                                        Join this service
                                                        <ArrowRight className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selected.staff.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
                                        Assigned staff
                                    </h4>
                                    <div className="max-h-[280px] overflow-y-auto pr-1">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {selected.staff.map((s) => (
                                                <div
                                                    key={s.id}
                                                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                                                >
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                                                        {s.fullName?.slice(0, 1).toUpperCase() || <UserCircle2 className="h-5 w-5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                            {s.fullName}
                                                        </div>
                                                        {s.email && (
                                                            <div className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                                                <Mail className="h-3 w-3 shrink-0" />
                                                                {s.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ) : (
                        <Card>
                            <div className="py-20 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <Building2 className="h-8 w-8 text-slate-400" />
                                </div>
                                <p className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    Select an office to view details
                                </p>
                                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                                    Pick an office from the list on the left to see its services, staff, and working hours.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}