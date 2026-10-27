import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, MapPin, Clock, Users, ListOrdered, Search, Ticket,
    ArrowRight, GraduationCap, UserCircle2, Info, Activity
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonBox, SkeletonSettingsCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { withAlpha } from '../../lib/colors'

function formatTime(token) {
    if (!token) return null
    return String(token).slice(0, 5)
}

function OfficesSkeleton() {
    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="mt-4 h-9 w-full" />
                <div className="mt-4 space-y-2">
                    {Array.from({ length: 6 }).map((unusedValue, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
                            <SkeletonBox className="h-3.5 w-32" />
                            <SkeletonBox className="h-4 w-6 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="space-y-6">
                <SkeletonSettingsCard />
                <SkeletonSettingsCard />
            </div>
        </div>
    )
}

export default function OfficesTab() {
    const { push } = useToastStore()
    const { user } = useAuthStore()
    const { university } = useUniversityStore()
    const navigate = useNavigate()

    const [offices, setOffices] = useState([])
    const [queues, setQueues] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedOfficeId, setSelectedOfficeId] = useState(null)

    const isFresher = user?.role === 'FRESHER'
    const primaryColor = university?.primaryColor || '#4f46e5'

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
                qs.forEach((queue) => {
                    const key = queue.officeId ? String(queue.officeId) : (queue.officeName || '__other__')
                    if (!map.has(key)) {
                        map.set(key, {
                            id: queue.officeId || key,
                            name: queue.officeName || 'Other services',
                            location: queue.officeLocation || '',
                            description: null,
                            isActive: true,
                            openingTime: null,
                            closingTime: null,
                            slotDurationMinutes: null,
                        })
                    }
                })
                setOffices(Array.from(map.values()).sort((firstValue, secondValue) => firstValue.name.localeCompare(secondValue.name)))
            } else {
                setOffices(os)
            }
            setQueues(qs)
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load offices' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 5000, slowMs: 15000 })

    const enriched = useMemo(() => {
        return offices.map((office) => {
            const services = queues.filter((queue) => {
                if (queue.officeId && office.id) return String(queue.officeId) === String(office.id)
                return queue.officeName === office.name
            })
            const staffMap = new Map()
            let waitingTotal = 0
            services.forEach((service) => {
                waitingTotal += service.waitingCount ?? 0
                ;(service.staff || []).forEach((stringValue) => {
                    if (!staffMap.has(stringValue.id)) staffMap.set(stringValue.id, stringValue)
                })
            })
            return { office: office, services, staff: Array.from(staffMap.values()), waitingTotal }
        })
    }, [offices, queues])

    const filtered = useMemo(() => {
        if (!search.trim()) return enriched
        const searchValue = search.toLowerCase()
        return enriched.filter(
            (item) =>
                item.office.name.toLowerCase().includes(searchValue) ||
                item.office.location?.toLowerCase().includes(searchValue) ||
                item.services.some((itemValue) => itemValue.name.toLowerCase().includes(searchValue))
        )
    }, [enriched, search])

    const selected = filtered.find(
        (item) => String(item.office.id ?? item.office.name) === String(selectedOfficeId)
    )

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <OfficesSkeleton />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Premium Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Campus Offices
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Browse offices on campus and the services they offer.
                </p>
            </div>

            {/* 👇 FIXED: Changed navigate('/profile') to navigate('/student/profile') */}
            {isFresher && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-start gap-3 rounded-xl border p-4"
                    style={{
                        backgroundColor: withAlpha(primaryColor, 0.08),
                        borderColor: withAlpha(primaryColor, 0.28),
                    }}
                >
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-sm">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                            You're registered as a fresher
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            Some services require a matric number. Once you receive yours,
                            update your profile to unlock everything.
                        </p>
                        <button
                            onClick={() => navigate('/student/profile')}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: primaryColor }}
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
                    variant="info"
                    title="No offices available yet"
                    description="Your university hasn't set up any offices. Check back soon or contact your admin."
                    action={
                        <button
                            onClick={() => navigate('/student')}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Back to home
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
                    {/* 👇 PREMIUM SIDEBAR LIST */}
                    <div className="lg:sticky lg:top-24">
                        <Card className="h-fit p-2 sm:p-4">
                            <h3 className="mb-4 px-2 text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                All Offices
                            </h3>

                            <div className="relative mb-4 px-2">
                                <Search className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search offices..."
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-800"
                                />
                            </div>

                            {filtered.length === 0 ? (
                                <div className="mx-2 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
                                    <Search className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        No offices match
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-1">
                                    {filtered.map((itemValue) => {
                                        const id = itemValue.office.id ?? itemValue.office.name
                                        const isSelected = String(id) === String(selectedOfficeId)
                                        return (
                                            <li key={String(id)}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOfficeId(id)}
                                                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm transition-all duration-200 ${
                                                        isSelected
                                                            ? 'font-semibold shadow-sm'
                                                            : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
                                                    }`}
                                                    style={
                                                        isSelected
                                                            ? {
                                                                backgroundColor: withAlpha(primaryColor, 0.1),
                                                                color: primaryColor,
                                                            }
                                                            : undefined
                                                    }
                                                >
                                                    <span className="truncate">{itemValue.office.name}</span>
                                                    <span
                                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                                                            isSelected
                                                                ? 'text-white'
                                                                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                        style={
                                                            isSelected
                                                                ? { backgroundColor: primaryColor }
                                                                : undefined
                                                        }
                                                    >
                                                        {itemValue.services.length}
                                                    </span>
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </Card>
                    </div>

                    {/* 👇 PREMIUM DETAILED VIEW */}
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <motion.div
                                key={String(selected.office.id ?? selected.office.name)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card padded={false} className="overflow-hidden">
                                    {/* Hero Header */}
                                    <div className="relative border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white p-6 sm:p-8 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800/30">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-slate-900/5"
                                                    style={{ backgroundColor: withAlpha(primaryColor, 0.15) }}
                                                >
                                                    <Building2 className="h-7 w-7" style={{ color: primaryColor }} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                                                            {selected.office.name}
                                                        </h3>
                                                        <Badge variant={selected.office.isActive === false ? 'default' : 'success'}>
                                                            {selected.office.isActive === false ? 'Inactive' : 'Active'}
                                                        </Badge>
                                                    </div>
                                                    {selected.office.location && (
                                                        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                            <MapPin className="h-4 w-4 shrink-0" />
                                                            {selected.office.location}
                                                        </p>
                                                    )}
                                                    {selected.office.description && (
                                                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                                            {selected.office.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate('/student/queues')}
                                                className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                Join a Queue
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 sm:p-8">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <Clock className="h-3.5 w-3.5" /> Hours
                                                </div>
                                                <div className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    {selected.office.openingTime && selected.office.closingTime ? (
                                                        <>{formatTime(selected.office.openingTime)} – {formatTime(selected.office.closingTime)}</>
                                                    ) : (
                                                        <span className="italic text-slate-400 font-medium">Not set</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <Activity className="h-3.5 w-3.5" /> Services
                                                </div>
                                                <div className="mt-2 text-xl font-bold" style={{ color: primaryColor }}>
                                                    {selected.services.length}
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <Users className="h-3.5 w-3.5" /> Staff
                                                </div>
                                                <div className="mt-2 text-xl font-bold text-sky-600 dark:text-sky-400">
                                                    {selected.staff.length}
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <Ticket className="h-3.5 w-3.5" /> Waiting
                                                </div>
                                                <div className="mt-2 text-xl font-bold text-amber-600 dark:text-amber-400">
                                                    {selected.waitingTotal}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Services List */}
                                        <div className="mt-8">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                                    Services in this Office
                                                </h4>
                                            </div>

                                            {selected.services.length === 0 ? (
                                                <EmptyState
                                                    icon={ListOrdered}
                                                    size="sm"
                                                    title="No services yet"
                                                    description="This office hasn't opened any services."
                                                />
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {selected.services.map((itemValue2) => {
                                                        const isLive = itemValue2.isOpen === true
                                                        return (
                                                            <div
                                                                key={itemValue2.id}
                                                                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-brand-700"
                                                            >
                                                                <div>
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <h5 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                                                                            {itemValue2.name}
                                                                        </h5>
                                                                        <div className="flex gap-1.5 shrink-0">
                                                                            {itemValue2.matricRequired && (
                                                                                <Badge variant="warning" className="flex items-center gap-1 text-[9px] px-1.5 py-0">
                                                                                    <GraduationCap className="h-2.5 w-2.5" /> Matric
                                                                                </Badge>
                                                                            )}
                                                                            <Badge variant={isLive ? 'success' : 'default'} className="text-[9px] px-1.5 py-0">
                                                                                {isLive ? 'Live' : 'Closed'}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>

                                                                    {itemValue2.description ? (
                                                                        <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                                            {itemValue2.description}
                                                                        </p>
                                                                    ) : (
                                                                        <p className="mt-2 text-xs font-medium italic text-slate-400 dark:text-slate-500">
                                                                            No description
                                                                        </p>
                                                                    )}

                                                                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                                                                        <span className={`flex items-center gap-1.5 font-bold ${isLive ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                                                                            <Users className="h-3.5 w-3.5 text-slate-400" />
                                                                            {itemValue2.waitingCount ?? 0} waiting
                                                                        </span>
                                                                        <span className={`flex items-center gap-1.5 font-bold ${isLive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                                                                            <Clock className="h-3.5 w-3.5 opacity-50" />
                                                                            ~{isLive ? (itemValue2.estimatedMinutes ?? 0) : 0} min
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {isLive ? (
                                                                    <button
                                                                        onClick={() => navigate('/student/queues')}
                                                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-brand-950/40 dark:group-hover:text-brand-300"
                                                                    >
                                                                        Join this service
                                                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                                    </button>
                                                                ) : (
                                                                    <div className="mt-4 flex w-full items-center justify-center rounded-lg bg-slate-50 px-4 py-2 text-sm font-bold text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                                                                        Currently Closed
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Staff List */}
                                        {selected.staff.length > 0 && (
                                            <div className="mt-8 border-t border-slate-100 pt-8 dark:border-slate-800">
                                                <h4 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                                                    Staff serving this office
                                                </h4>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    {selected.staff.map((itemValue3) => (
                                                        <div
                                                            key={itemValue3.id}
                                                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/40"
                                                        >
                                                            <div
                                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-inner"
                                                                style={{ backgroundColor: primaryColor }}
                                                            >
                                                                {itemValue3.fullName?.slice(0, 1).toUpperCase() || (
                                                                    <UserCircle2 className="h-5 w-5" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                                                                    {itemValue3.fullName}
                                                                </div>
                                                                <div className="text-[11px] font-medium text-slate-500">Staff Member</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        ) : (
                            <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/20">
                                <EmptyState
                                    icon={Info}
                                    variant="info"
                                    size="lg"
                                    bordered={false}
                                    title="Select an office to view details"
                                    description="Pick an office from the list on the left to see its services, staff, and working hours."
                                />
                            </Card>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}