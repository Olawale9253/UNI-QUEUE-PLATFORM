import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Building2, MapPin, Clock, Users, ListOrdered, Search, Ticket,
    GraduationCap,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

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
    return Array.from(map.values()).sort((firstValue, secondValue) => firstValue.label.localeCompare(secondValue.label))
}

function gridClassForCount(count) {
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2'
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
}

function ServiceCard({ service }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
        >
            <Card className="flex h-full flex-col">
                <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">
                        {service.name}
                    </h3>
                    {service.isActive !== false ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
                    ) : (
                        <Badge variant="default">Inactive</Badge>
                    )}
                </div>

                {service.description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {service.description}
                    </p>
                )}

                {service.location && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{service.location}</span>
                    </p>
                )}

                {service.opensAt && service.closesAt && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3 shrink-0" />
                        {String(service.opensAt).slice(0, 5)} – {String(service.closesAt).slice(0, 5)}
                    </p>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                            <Users className="h-3 w-3" />
                            Waiting
                        </div>
                        <div className="mt-1 text-base font-bold text-brand-600 dark:text-brand-400">
                            {service.waitingCount ?? 0}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                            <Clock className="h-3 w-3" />
                            ~Wait
                        </div>
                        <div className="mt-1 text-base font-bold text-amber-600 dark:text-amber-400">
                            {service.estimatedMinutes ?? 0}
                            <span className="text-xs font-normal text-slate-500">m</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                            <Ticket className="h-3 w-3" />
                            Staff
                        </div>
                        <div className="mt-1 text-base font-bold text-sky-600 dark:text-sky-400">
                            {service.staffCount ?? 0}
                        </div>
                    </div>
                </div>

                {service.currentlyServing ? (
                    <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs dark:bg-emerald-950/30">
                        <span className="text-slate-600 dark:text-slate-400">Now serving: </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {service.currentlyServing}
            </span>
                    </div>
                ) : (
                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                        No one currently being served
                    </div>
                )}

                {(service.matricRequired || service.allowWaitlist) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {service.matricRequired && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <GraduationCap className="h-3 w-3" />
                Matric required
              </span>
                        )}
                        {service.allowWaitlist && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">
                <ListOrdered className="h-3 w-3" />
                Waitlist enabled
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
    const [selectedOfficeKey, setSelectedOfficeKey] = useState(null)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/staff/queues')
            setServices(res.data?.data || [])
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to load services',
            })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    const allGroups = useMemo(() => groupByOffice(services), [services])

    const visibleGroups = useMemo(() => {
        if (!search.trim()) return allGroups
        const stringValue = search.trim().toLowerCase()
        return allGroups
            .map((allGroup) => {
                const officeMatches =
                    allGroup.label.toLowerCase().includes(stringValue) ||
                    allGroup.location?.toLowerCase().includes(stringValue)

                const matchingServices = allGroup.services.filter(
                    (svc) =>
                        svc.name?.toLowerCase().includes(stringValue) ||
                        svc.location?.toLowerCase().includes(stringValue)
                )

                if (officeMatches) return allGroup
                if (matchingServices.length > 0) {
                    return {
                        ...allGroup,
                        services: matchingServices,
                        waitingTotal: matchingServices.reduce(
                            (sum, svc) => sum + (svc.waitingCount ?? 0),
                            0
                        ),
                    }
                }
                return null
            })
            .filter(Boolean)
    }, [allGroups, search])

    useEffect(() => {
        if (!selectedOfficeKey && visibleGroups.length > 0) {
            setSelectedOfficeKey(visibleGroups[0].key)
        }
    }, [visibleGroups, selectedOfficeKey])

    useEffect(() => {
        if (
            selectedOfficeKey &&
            !visibleGroups.some((visibleGroup) => visibleGroup.key === selectedOfficeKey) &&
            visibleGroups.length > 0
        ) {
            setSelectedOfficeKey(visibleGroups[0].key)
        }
    }, [visibleGroups, selectedOfficeKey])

    const selectedGroup = visibleGroups.find((visibleGroup) => visibleGroup.key === selectedOfficeKey)

    const totalWaiting = useMemo(
        () => services.reduce((sum, item) => sum + (item.waitingCount ?? 0), 0),
        [services]
    )

    if (loading) {
        return (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
                <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
        )
    }

    return (
        <div>
            {/* ═══ Title — scrolls away ═══ */}
            <div className="mb-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Services
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {services.length} {services.length === 1 ? 'service' : 'services'} across{' '}
                    {allGroups.length} {allGroups.length === 1 ? 'office' : 'offices'}
                    {totalWaiting > 0 && (
                        <>
                            {' · '}
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                {totalWaiting} waiting
              </span>
                        </>
                    )}
                </p>
            </div>

            {/* ═══ Search bar — sticky ═══ */}
            {services.length > 0 && (
                <div className="sticky top-[150px] z-20 -mx-3 mb-5 bg-slate-50/95 px-3 pb-3 pt-2 backdrop-blur-sm dark:bg-slate-950/95 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by service name, office, or location"
                            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                    </div>
                </div>
            )}

            {/* ═══ Body ═══ */}
            {services.length === 0 ? (
                <EmptyState
                    icon={ListOrdered}
                    title="No services assigned"
                    description="You haven't been assigned to any services yet. Contact your administrator to get started."
                />
            ) : visibleGroups.length === 0 ? (
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
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
                    {/* ═══ LEFT: Offices — sticky ═══ */}
                    <div className="lg:sticky lg:top-[215px]">
                        <Card className="h-fit">
                            <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                                        Offices
                                    </h3>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {visibleGroups.length}
                </span>
                            </div>

                            <ul className="space-y-1">
                                {visibleGroups.map((visibleGroupValue) => {
                                    const isSelected = visibleGroupValue.key === selectedOfficeKey
                                    return (
                                        <li key={visibleGroupValue.key}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedOfficeKey(visibleGroupValue.key)}
                                                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                                    isSelected
                                                        ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                                                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <span className="truncate">{visibleGroupValue.label}</span>
                                                <div className="flex shrink-0 items-center gap-1.5">
                                                    {visibleGroupValue.waitingTotal > 0 && (
                                                        <span
                                                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                                                isSelected
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                                            }`}
                                                        >
                              {visibleGroupValue.waitingTotal}
                            </span>
                                                    )}
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            isSelected
                                                                ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                    >
                            {visibleGroupValue.services.length}
                          </span>
                                                </div>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>

                            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Waiting
                </span>
                                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-400" />
                  Services
                </span>
                            </div>
                        </Card>
                    </div>

                    {/* ═══ RIGHT: Services ═══ */}
                    <div className="min-w-0">
                        {selectedGroup ? (
                            <>
                                <Card className="mb-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                                                <Building2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                                    {selectedGroup.label}
                                                </h3>
                                                {selectedGroup.location && (
                                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                        {selectedGroup.location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                                    Services
                                                </div>
                                                <div className="text-xl font-bold text-brand-600 dark:text-brand-400">
                                                    {selectedGroup.services.length}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                                    Waiting
                                                </div>
                                                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                                    {selectedGroup.waitingTotal}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <div className="mb-4 flex items-center gap-2">
                                    <ListOrdered className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                                    <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                                        Services in this office
                                    </h4>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {selectedGroup.services.length}
                  </span>
                                </div>

                                <div className={`grid gap-4 ${gridClassForCount(selectedGroup.services.length)}`}>
                                    {selectedGroup.services.map((item) => (
                                        <ServiceCard key={item.id} service={item} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <Card>
                                <div className="py-16 text-center">
                                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                        <Building2 className="h-7 w-7 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Select an office
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Pick an office from the left to see its services.
                                    </p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}