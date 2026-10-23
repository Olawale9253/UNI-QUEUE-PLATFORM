import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, MapPin, Clock, Users, ListOrdered, Search, Ticket,
    GraduationCap, ChevronRight, Filter
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { stagger, staggerItem } from '../../lib/motion'

function groupByOffice(services) {
    const map = new Map()
    for (const queue of services) {
        const label = (queue.officeName || queue.department || 'General').trim() || 'General'
        const key = label.toLowerCase()
        if (!map.has(key)) {
            map.set(key, {
                key,
                label,
                location: queue.officeLocation || queue.location || '',
                services: [],
                waitingTotal: 0,
            })
        }
        const mapValue = map.get(key)
        mapValue.services.push(queue)
        mapValue.waitingTotal += queue.waitingCount ?? 0
        if (!mapValue.location && (queue.officeLocation || queue.location)) {
            mapValue.location = queue.officeLocation || queue.location
        }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
}

function ServiceCard({ service }) {
    return (
        <motion.div variants={staggerItem} className="h-full">
            <Card className="group flex h-full flex-col transition-all duration-200 hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {service.name}
                        </h3>
                        {service.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                                {service.description}
                            </p>
                        )}
                    </div>
                    {service.isActive !== false ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            Live
                        </span>
                    ) : (
                        <Badge variant="default">Inactive</Badge>
                    )}
                </div>

                <div className="mt-2 space-y-1.5">
                    {service.location && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {service.location}
                        </p>
                    )}
                    {service.opensAt && service.closesAt && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {String(service.opensAt).slice(0, 5)} – {String(service.closesAt).slice(0, 5)}
                        </p>
                    )}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <Users className="h-3 w-3" /> Waiting
                        </div>
                        <div className="mt-1 text-xl font-bold text-brand-600 dark:text-brand-400">
                            {service.waitingCount ?? 0}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" /> ~Wait
                        </div>
                        <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
                            {service.estimatedMinutes ?? 0}<span className="text-sm font-medium text-slate-500 ml-0.5">m</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <Ticket className="h-3 w-3" /> Staff
                        </div>
                        <div className="mt-1 text-xl font-bold text-sky-600 dark:text-sky-400">
                            {service.staffCount ?? 0}
                        </div>
                    </div>
                </div>

                {service.currentlyServing ? (
                    <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs dark:bg-emerald-950/30">
                        <span className="text-slate-600 dark:text-slate-400">Now serving: </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {service.currentlyServing}
                        </span>
                    </div>
                ) : (
                    <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                        No one currently being served
                    </div>
                )}

                {(service.matricRequired || service.allowWaitlist) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {service.matricRequired && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                <GraduationCap className="h-3 w-3" /> Matric required
                            </span>
                        )}
                        {service.allowWaitlist && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">
                                <ListOrdered className="h-3 w-3" /> Waitlist enabled
                            </span>
                        )}
                    </div>
                )}
            </Card>
        </motion.div>
    )
}

export default function QueuesList() {
    const { push } = useToastStore()
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedOffice, setSelectedOffice] = useState('ALL')

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/staff/queues')
            setServices(res.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load services' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    const allGroups = useMemo(() => groupByOffice(services), [services])

    const filteredGroups = useMemo(() => {
        let groups = allGroups

        // Filter by Selected Office Pill
        if (selectedOffice !== 'ALL') {
            groups = groups.filter(g => g.key === selectedOffice)
        }

        // Filter by Search
        if (search.trim()) {
            const s = search.trim().toLowerCase()
            groups = groups.map((g) => {
                const officeMatches = g.label.toLowerCase().includes(s) || g.location?.toLowerCase().includes(s)
                const matchingServices = g.services.filter((svc) => svc.name?.toLowerCase().includes(s) || svc.location?.toLowerCase().includes(s))
                if (officeMatches) return g
                if (matchingServices.length > 0) {
                    return { ...g, services: matchingServices, waitingTotal: matchingServices.reduce((sum, svc) => sum + (svc.waitingCount ?? 0), 0) }
                }
                return null
            }).filter(Boolean)
        }

        return groups
    }, [allGroups, selectedOffice, search])

    const totalWaiting = useMemo(() => services.reduce((sum, item) => sum + (item.waitingCount ?? 0), 0), [services])

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />)}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Services Directory
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Browse {services.length} services across {allGroups.length} offices.
                        {totalWaiting > 0 && (
                            <span className="ml-2 font-bold text-amber-600 dark:text-amber-400">
                                {totalWaiting} students currently waiting.
                            </span>
                        )}
                    </p>
                </div>
                <div className="w-full max-w-sm">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search services or locations..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                    </div>
                </div>
            </div>

            {/* Office Filter Pills */}
            {services.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <Filter className="mr-1 h-4 w-4 shrink-0 text-slate-400" />
                    <button
                        onClick={() => setSelectedOffice('ALL')}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            selectedOffice === 'ALL'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                        }`}
                    >
                        All Offices
                    </button>
                    {allGroups.map((g) => (
                        <button
                            key={g.key}
                            onClick={() => setSelectedOffice(g.key)}
                            className={`shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                selectedOffice === g.key
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                        >
                            {g.label}
                            {g.waitingTotal > 0 && (
                                <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                                    selectedOffice === g.key ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                }`}>
                                    {g.waitingTotal}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Content */}
            {services.length === 0 ? (
                <EmptyState icon={ListOrdered} title="No services assigned" description="You haven't been assigned to any services yet. Contact your administrator to get started." />
            ) : filteredGroups.length === 0 ? (
                <EmptyState icon={Search} title="No services match" description="Try a different search term or office filter." action={<Button variant="secondary" onClick={() => { setSearch(''); setSelectedOffice('ALL') }}>Clear filters</Button>} />
            ) : (
                <div className="space-y-10">
                    {filteredGroups.map((group, groupIdx) => (
                        <motion.section
                            key={group.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIdx * 0.05 }}
                        >
                            {/* Office Section Header */}
                            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                            {group.label}
                                        </h2>
                                        {group.location && (
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                                <MapPin className="h-3 w-3" /> {group.location}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Waiting</span>
                                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{group.waitingTotal}</div>
                                </div>
                            </div>

                            {/* Services Grid for this Office */}
                            <motion.div
                                variants={stagger(0, 0.05)}
                                initial="initial"
                                animate="animate"
                                className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
                            >
                                {group.services.map((item) => (
                                    <ServiceCard key={item.id} service={item} />
                                ))}
                            </motion.div>
                        </motion.section>
                    ))}
                </div>
            )}
        </div>
    )
}