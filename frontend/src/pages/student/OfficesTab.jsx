import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
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
        <button type="button" onClick={copy} title="Copy to clipboard" className="rounded p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" style={{ color: primaryColor }}>
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

    // Ref for scrolling to details on mobile
    const detailsRef = useRef(null)

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

    // HANDLE CLICK & SCROLL ON MOBILE
    const handleOfficeSelect = (id) => {
        setSelectedOfficeId(id)

        // Only scroll on mobile/tablet (less than 1024px)
        if (window.innerWidth < 1024) {
            setTimeout(() => {
                detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100) // Small delay to ensure the detail card is rendered in the DOM
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 pb-12 px-4 sm:px-6">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <OfficesSkeleton />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Campus Offices
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                        View university offices, staff details, and active counters. Find the right department, get contact information, and navigate campus services with ease.
                    </p>
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
                                                        onClick={() => handleOfficeSelect(id)} // <-- Updated onClick
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
                                ref={detailsRef} // <-- Added ref for scrolling
                                className="space-y-6 scroll-mt-24" // <-- scroll-mt-24 prevents header from covering it
                            >
                                <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl">

                                    <div
                                        className="p-4 sm:p-6 relative overflow-hidden text-white"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20 pointer-events-none" />

                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
                                            <div className="flex items-start gap-3 sm:gap-5">
                                                <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/20 text-white">
                                                    <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 drop-shadow-md">
                                                        {selected.office.name}
                                                        <Badge variant={isOfficeOpenNow(selected.office.openingTime, selected.office.closingTime, selected.office.isActive) ? 'success' : 'danger'} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 border-0 text-white bg-white/20">
                                                            {isOfficeOpenNow(selected.office.openingTime, selected.office.closingTime, selected.office.isActive) ? 'Open' : 'Closed'}
                                                        </Badge>
                                                    </h2>
                                                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-white/80">
                                                        {university?.name || 'University Portal'} {university?.code ? `(${university.code})` : ''}
                                                    </p>
                                                    <p className="mt-2 sm:mt-3 max-w-lg text-xs sm:text-sm leading-relaxed text-white/90 line-clamp-2">
                                                        {selected.office.description || 'Course registration, academic records, and more.'}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setContactModalOpen(true)}
                                                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 mt-2 sm:mt-0"
                                            >
                                                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                Contact
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

                                    <div className="p-4 sm:p-6">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                                Staff Details
                                            </h3>
                                            <span
                                                className="inline-flex items-center rounded-full px-3 py-1 text-[10px] sm:text-xs font-bold"
                                                style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                                            >
                                                {selected.staff.length} Staff Member{selected.staff.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                                            {selected.staff.length === 0 ? (
                                                <div className="p-6 sm:p-8 text-center text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                                    No staff members assigned to this office yet.
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {selected.staff.map((staff) => (
                                                        <div key={staff.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 sm:px-6 gap-3 sm:gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                                <div
                                                                    className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full text-base sm:text-lg font-bold text-white shadow-inner"
                                                                    style={{ backgroundColor: primaryColor }}
                                                                >
                                                                    {staff.fullName?.charAt(0) || <UserCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                                                                        {staff.fullName}
                                                                    </div>
                                                                    <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm font-medium text-slate-500 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1">
                                                                        <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-60" /> {staff.email || 'Not assigned'}</span>
                                                                        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-60" /> {staff.phone || 'Not assigned'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => setProfileStaff(staff)}
                                                                className="shrink-0 inline-flex items-center justify-center rounded-lg border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 mt-2 sm:mt-0"
                                                                style={{ borderColor: withAlpha(primaryColor, 0.3), color: primaryColor }}
                                                            >
                                                                View Profile
                                                                <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Card>
                                    </div>

                                    <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800">
                                        <h3 className="mb-4 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {selected.services.map((service) => (
                                                    <div
                                                        key={service.id}
                                                        onClick={() => navigate('/student/queues')}
                                                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4 transition-all hover:border-brand-300 hover:shadow-sm cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
                                                    >
                                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                                                                <Ticket className="h-4 w-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{service.name}</p>
                                                                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                                                    {service.waitingCount ?? 0} waiting • {service.estimatedMinutes ?? 0} mins
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        ) : (
                            <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}>
                                        <Info className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Select an office</h3>
                                    <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                                        Pick an office from the list above to view its contact details, staff members, and services.
                                    </p>
                                </div>
                            </Card>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* --- Contact Modal --- */}
            <AnimatePresence>
                {contactModalOpen && selected && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setContactModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                    Contact {selected.office.name}
                                </h3>
                                <button
                                    onClick={() => setContactModalOpen(false)}
                                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-5 sm:p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                        <MapPin className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {selected.office.location || 'Main Administrative Building'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                        <Phone className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</p>
                                        <div className="flex items-center gap-1">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {selected.office.phone || 'Not assigned'}
                                            </p>
                                            {selected.office.phone && <CopyButton text={selected.office.phone} primaryColor={primaryColor} />}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                        <Mail className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</p>
                                        <div className="flex items-center gap-1">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-all">
                                                {selected.office.email || 'Not assigned'}
                                            </p>
                                            {selected.office.email && <CopyButton text={selected.office.email} primaryColor={primaryColor} />}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                        <Clock className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Working Hours</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {selected.office.openingTime && selected.office.closingTime
                                                ? `${formatTime(selected.office.openingTime)} – ${formatTime(selected.office.closingTime)}`
                                                : '8:00 AM – 4:00 PM'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                <button
                                    onClick={() => setContactModalOpen(false)}
                                    className="px-5 py-2 rounded-xl bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- Staff Profile Modal --- */}
            <AnimatePresence>
                {profileStaff && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setProfileStaff(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                            <div
                                className="p-6 text-white relative overflow-hidden"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20 pointer-events-none" />
                                <div className="relative z-10 flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-inner border border-white/20 text-2xl font-bold text-white">
                                            {profileStaff.fullName?.charAt(0) || <UserCircle2 className="h-7 w-7" />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{profileStaff.fullName}</h3>
                                            <p className="text-sm font-medium text-white/80">{selected?.office.name || 'Staff Member'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setProfileStaff(null)}
                                        className="rounded-full p-2 bg-white/10 hover:bg-white/25 transition-colors"
                                    >
                                        <X className="h-4 w-4 text-white" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                        <Mail className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-all">
                                            {profileStaff.email || 'Not assigned'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                        <Phone className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {profileStaff.phone || 'Not assigned'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                        <Building2 className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Office</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {selected?.office.name || 'University Office'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                <button
                                    onClick={() => setProfileStaff(null)}
                                    className="px-5 py-2 rounded-xl bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}