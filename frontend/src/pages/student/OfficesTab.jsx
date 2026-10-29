import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, MapPin, Clock, Users, ListOrdered, Search, Ticket,
    ArrowRight, GraduationCap, UserCircle2, Info, ChevronRight, Activity,
    Mail, Phone, X, Copy, Check, Lock
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

function isOfficeOpenNow(openingTime, closingTime, isActive) {
    if (isActive === false) return false;
    if (!openingTime || !closingTime) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = openingTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const [closeH, closeM] = closingTime.split(':').map(Number);
    const closeMinutes = closeH * 60 + closeM;
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

function CopyButton({ text, primaryColor }) {
    const [copied, setCopied] = useState(false)
    const copy = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {}
    }
    return (
        <button
            type="button"
            onClick={copy}
            title="Copy to clipboard"
            className="rounded p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: primaryColor }}
        >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
    )
}

function OfficesSkeleton() {
    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_1fr]">
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

    const [contactModalOpen, setContactModalOpen] = useState(false)
    const [profileStaff, setProfileStaff] = useState(null)

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
        <div className="bg-white dark:bg-slate-950 min-h-screen -m-4 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8">
            <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            Campus Offices
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                            View university offices and staff details. Find the right office, get contact information, and know who to see for your needs.
                        </p>
                    </div>

                    <div
                        className="hidden md:flex items-center gap-3 rounded-xl border px-4 py-3"
                        style={{
                            backgroundColor: withAlpha(primaryColor, 0.08),
                            borderColor: withAlpha(primaryColor, 0.2)
                        }}
                    >
                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{
                                backgroundColor: withAlpha(primaryColor, 0.15),
                                color: primaryColor
                            }}
                        >
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Talk to the Right People</div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Get the help you need, faster.</div>
                        </div>
                    </div>
                </div>

                {offices.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        variant="info"
                        title="No offices available yet"
                        description="Your university hasn't set up any offices. Check back soon or contact your admin."
                    />
                ) : (
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_1fr]">
                        <div className="lg:sticky lg:top-24">
                            <Card className="h-fit p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
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

                                <div className="p-2">
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
                                                const isOpen = isOfficeOpenNow(itemValue.office.openingTime, itemValue.office.closingTime, itemValue.office.isActive)

                                                return (
                                                    <li key={String(id)}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedOfficeId(id)}
                                                            className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                                                                isSelected
                                                                    ? 'bg-white dark:bg-slate-800/60 shadow-sm'
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

                                                            <Badge variant={isOpen ? 'success' : 'danger'} className="shrink-0 text-[9px] px-1.5 py-0">
                                                                {isOpen ? 'Open' : 'Closed'}
                                                            </Badge>
                                                        </button>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </Card>
                        </div>

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
                                    <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl">

                                        {/* 👇 SOLID COLOR HEADER WITH GRADIENT OVERLAY */}
                                        <div
                                            className="p-6 sm:p-8 relative overflow-hidden text-white"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20 pointer-events-none" />

                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
                                                <div className="flex items-start gap-5">
                                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/20 text-white">
                                                        <Building2 className="h-8 w-8" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3 drop-shadow-md">
                                                            {selected.office.name}
                                                            <Badge variant={isOfficeOpenNow(selected.office.openingTime, selected.office.closingTime, selected.office.isActive) ? 'success' : 'danger'} className="text-xs px-2 py-0.5 border-0 text-white bg-white/20">
                                                                {isOfficeOpenNow(selected.office.openingTime, selected.office.closingTime, selected.office.isActive) ? 'Open' : 'Closed'}
                                                            </Badge>
                                                        </h2>
                                                        <p className="mt-1 text-sm font-medium text-white/80">
                                                            {university?.name || 'University Portal'} {university?.code ? `(${university.code})` : ''}
                                                        </p>
                                                        <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/90">
                                                            {selected.office.description || 'Course registration, academic records, and more.'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setContactModalOpen(true)}
                                                    className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    Contact Office
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                                            <div className="flex items-start gap-3 p-4">
                                                <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1" title={selected.office.location || 'Main Administrative Building'}>
                                                        {selected.office.location || 'Main Administrative Building'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-4">
                                                <Phone className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone Number</div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                        {selected.office.phone || 'Not assigned'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-4">
                                                <Clock className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Working Hours</div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        <div>Mon – Fri</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {selected.office.openingTime && selected.office.closingTime
                                                                ? `${formatTime(selected.office.openingTime)} – ${formatTime(selected.office.closingTime)}`
                                                                : '8:00 AM – 4:00 PM'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6">
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
                                            <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                                                {selected.staff.length === 0 ? (
                                                    <div className="p-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                                                        No staff members assigned to this office yet.
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {selected.staff.map((staff) => (
                                                            <div key={staff.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
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
                                                                        <div className="mt-1 text-sm font-medium text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                                                                            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 opacity-60" /> {staff.email || 'Not assigned'}</span>
                                                                            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 opacity-60" /> {staff.phone || 'Not assigned'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    onClick={() => setProfileStaff(staff)}
                                                                    className="shrink-0 inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                                                                    style={{ borderColor: withAlpha(primaryColor, 0.3), color: primaryColor }}
                                                                >
                                                                    View Profile
                                                                    <ChevronRight className="ml-1 h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card>
                                        </div>

                                        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
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
                                                            <Card key={service.id} className="group flex flex-col justify-between transition-all hover:border-slate-300 hover:shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                                                                <div className="p-4">
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

                                                                <div className="p-4 pt-0">
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
                                    </Card>
                                </motion.div>
                            ) : (
                                <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
                                    <div className="flex flex-col items-center justify-center p-8 text-center">
                                        <div
                                            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                                            style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                                        >
                                            <Info className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Select an office to view details</h3>
                                        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                                            Pick an office from the list on the left to see its staff, contact information, and available services.
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {contactModalOpen && selected && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setContactModalOpen(false)}
                            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl pointer-events-auto overflow-hidden dark:border-slate-700 dark:bg-slate-900"
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Contact {selected.office.name}</h3>
                                    <button onClick={() => setContactModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <a href={`mailto:${selected.office.email || 'office@university.edu'}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 group">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}>
                                                <Mail className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:underline">{selected.office.email || 'Not assigned'}</div>
                                            </div>
                                        </div>
                                        {selected.office.email && <CopyButton text={selected.office.email} primaryColor={primaryColor} />}
                                    </a>

                                    <a href={`tel:${selected.office.phone || ''}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 group">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}>
                                                <Phone className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone Number</div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:underline">{selected.office.phone || 'Not assigned'}</div>
                                            </div>
                                        </div>
                                        {selected.office.phone && <CopyButton text={selected.office.phone} primaryColor={primaryColor} />}
                                    </a>
                                </div>
                                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 flex justify-end">
                                    <button onClick={() => setContactModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {profileStaff && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setProfileStaff(null)}
                            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl pointer-events-auto overflow-hidden dark:border-slate-700 dark:bg-slate-900"
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Staff Profile</h3>
                                    <button onClick={() => setProfileStaff(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="p-6 flex flex-col items-center">
                                    <div
                                        className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white shadow-inner mb-4"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {profileStaff.fullName?.charAt(0) || <UserCircle2 className="h-10 w-10" />}
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{profileStaff.fullName}</h4>
                                    <p className="text-sm font-medium text-slate-500 mb-6">{selected?.office.name || 'University Staff'}</p>

                                    <div className="w-full space-y-3">
                                        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{profileStaff.email || 'Not assigned'}</span>
                                            </div>
                                            {profileStaff.email && <CopyButton text={profileStaff.email} primaryColor={primaryColor} />}
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{profileStaff.phone || 'Not assigned'}</span>
                                            </div>
                                            {profileStaff.phone && <CopyButton text={profileStaff.phone} primaryColor={primaryColor} />}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 flex justify-end">
                                    <button onClick={() => setProfileStaff(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}