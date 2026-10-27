import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, MapPin, Clock, Users, ListOrdered, Search, Ticket,
    ArrowRight, GraduationCap, UserCircle2, Info, ChevronRight, Activity,
    Mail, Phone
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
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <SkeletonBox className="h-10 w-full" />
                <div className="mt-4 space-y-2">
                    {Array.from({ length: 6 }).map((unusedValue, index) => (
                        <div key={index} className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3">
                            <SkeletonBox className="h-4 w-32" />
                            <SkeletonBox className="h-3 w-48" />
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
            {/* Header Section with Top Right Banner */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Campus Offices
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                        View university offices and staff details. Find the right office, get contact information, and know who to see for your needs.
                    </p>
                </div>

                <div className="hidden md:flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 dark:border-blue-900/30 dark:bg-blue-900/10">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Talk to the Right People</div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Get the help you need, faster.</div>
                    </div>
                </div>
            </div>

            {isFresher && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2 flex items-start gap-3 rounded-xl border p-4"
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
                            Some services require a matric number. Once you receive yours, update your profile to unlock everything.
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
                />
            ) : (
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_1fr]">

                    {/* LEFT SIDEBAR (Office List) */}
                    <div className="lg:sticky lg:top-24">
                        <Card className="h-fit p-0 overflow-hidden border-slate-200 dark:border-slate-800">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search for an office..."
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2">
                                {filtered.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No offices match</p>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">Try a different search term.</p>
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
                                                        className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                                                            isSelected
                                                                ? 'bg-slate-50 dark:bg-slate-800/60'
                                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                                        }`}
                                                        style={isSelected ? {
                                                            borderLeft: `4px solid ${primaryColor}`,
                                                            backgroundColor: withAlpha(primaryColor, 0.05)
                                                        } : undefined}
                                                    >
                                                        <div
                                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"
                                                            style={isSelected ? { backgroundColor: withAlpha(primaryColor, 0.15), color: primaryColor } : { color: '#64748b' }}
                                                        >
                                                            <Building2 className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className={`text-sm font-bold truncate ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}
                                                                 style={isSelected ? { color: primaryColor } : undefined}
                                                            >
                                                                {itemValue.office.name}
                                                            </div>
                                                            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                                                {itemValue.office.description || `View services and staff for ${itemValue.office.name}.`}
                                                            </div>
                                                        </div>
                                                        <ChevronRight className={`h-4 w-4 shrink-0 mt-1 transition-transform ${isSelected ? 'translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}
                                                                      style={isSelected ? { color: primaryColor } : undefined}
                                                        />
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT PANEL (Office Details) */}
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <motion.div
                                key={String(selected.office.id ?? selected.office.name)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {/* Hero Card */}
                                <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/30">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10"
                                                    style={{ color: primaryColor }}
                                                >
                                                    <Building2 className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                        {selected.office.name}
                                                    </h2>
                                                    <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                        {university?.name || 'University Portal'}
                                                    </p>
                                                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                                        {selected.office.description || 'Course registration, academic records, and more.'}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate('/student/queues')}
                                                className="shrink-0 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
                                                style={{
                                                    borderColor: primaryColor,
                                                    color: primaryColor,
                                                    backgroundColor: withAlpha(primaryColor, 0.05)
                                                }}
                                            >
                                                <Phone className="h-4 w-4" />
                                                Get Office Contact
                                            </button>
                                        </div>
                                    </div>

                                    {/* 3-Column Info Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                        <div className="flex items-start gap-3 p-5">
                                            <MapPin className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" />
                                            <div>
                                                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Office Location</div>
                                                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {selected.office.location || 'Main Administrative Building'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-5">
                                            <Mail className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" />
                                            <div>
                                                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Phone Number</div>
                                                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    +234 803 123 4567
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-5">
                                            <Clock className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" />
                                            <div>
                                                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Working Hours</div>
                                                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {selected.office.openingTime && selected.office.closingTime
                                                        ? `Mon – Fri: ${formatTime(selected.office.openingTime)} – ${formatTime(selected.office.closingTime)}`
                                                        : 'Mon – Fri: 8:00 AM – 4:00 PM'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Staff Details Section */}
                                {selected.staff.length > 0 && (
                                    <div>
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                                Staff Details
                                            </h3>
                                            <span
                                                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                                                style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                                            >
                                                {selected.staff.length} Staff Member{selected.staff.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {selected.staff.map((staff) => (
                                                    <div key={staff.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-inner"
                                                                style={{ backgroundColor: primaryColor }}
                                                            >
                                                                {staff.fullName?.charAt(0) || <UserCircle2 className="h-6 w-6" />}
                                                            </div>
                                                            <div>
                                                                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                                    {staff.fullName}
                                                                </div>
                                                                <div className="mt-0.5 text-sm font-medium text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                                                                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {staff.email || 'staff@university.edu'}</span>
                                                                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {staff.phone || '+234 ...'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button className="shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            View Profile
                                                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {/* Services List (Kept for Queue functionality) */}
                                <div>
                                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                                        Services Offered
                                    </h3>
                                    {selected.services.length === 0 ? (
                                        <EmptyState
                                            icon={ListOrdered}
                                            size="sm"
                                            title="No services yet"
                                            description="This office hasn't opened any services."
                                        />
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selected.services.map((service) => {
                                                const isLive = service.isOpen === true
                                                const isLocked = isFresher && service.matricRequired
                                                return (
                                                    <Card key={service.id} className="group flex flex-col justify-between transition-all hover:border-slate-300 hover:shadow-md">
                                                        <div>
                                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                                    {service.name}
                                                                </h4>
                                                                <Badge variant={isLive ? 'success' : 'default'} className="shrink-0">
                                                                    {isLive ? 'Live' : 'Closed'}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5rem]">
                                                                {service.description || 'No description provided.'}
                                                            </p>

                                                            <div className="mt-4 flex items-center gap-4 text-xs font-semibold">
                                                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                                    <Users className="h-3.5 w-3.5 opacity-50" />
                                                                    {service.waitingCount ?? 0} waiting
                                                                </span>
                                                                <span className={`flex items-center gap-1.5 ${isLive ? 'text-amber-600' : 'text-slate-400'}`}>
                                                                    <Clock className="h-3.5 w-3.5 opacity-50" />
                                                                    ~{service.estimatedMinutes ?? 0} min
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                            {isLocked ? (
                                                                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400 dark:bg-slate-800/50 dark:text-slate-500 cursor-not-allowed">
                                                                    Update profile to join
                                                                </div>
                                                            ) : isLive ? (
                                                                <button
                                                                    onClick={() => navigate('/student/queues')}
                                                                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
                                                                    style={{ backgroundColor: primaryColor }}
                                                                >
                                                                    Join this queue
                                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                                                </button>
                                                            ) : (
                                                                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed">
                                                                    Currently Closed
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/20">
                                <EmptyState
                                    icon={Info}
                                    variant="info"
                                    size="lg"
                                    bordered={false}
                                    title="Select an office to view details"
                                    description="Pick an office from the list on the left to see its staff, contact information, and available services."
                                />
                            </Card>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}