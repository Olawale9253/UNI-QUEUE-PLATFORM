import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Calendar, Clock, MapPin, Phone, Search, ChevronRight,
    Building2, Users, HelpCircle, GraduationCap,
    FileText, Monitor, Banknote, UserCircle2, Info, ChevronDown,
    Award, ClipboardList, AlertCircle, Mail, RefreshCw, CalendarPlus
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { useToastStore } from '../../store/toastStore'
import { useUniversityStore } from '../../store/universityStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'
import { withAlpha } from '../../lib/colors'

function getCategoryIcon(category, name) {
    const c = (category || '').toLowerCase()
    const n = (name || '').toLowerCase()
    if (c.includes('academic') || n.includes('academic')) return GraduationCap
    if (c.includes('financial') || n.includes('bursary') || n.includes('fee')) return Banknote
    if (c.includes('registry') || n.includes('transcript')) return FileText
    if (c.includes('ict') || n.includes('computer')) return Monitor
    if (c.includes('welfare') || c.includes('student') || n.includes('counsel')) return Users
    return Building2
}

function formatSlotDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = d.toDateString() === tomorrow.toDateString()
    const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    if (isToday) return `Today - ${label}`
    if (isTomorrow) return `Tomorrow - ${label}`
    return label
}

function formatSlotTime(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function AppointmentsTab() {
    const { push } = useToastStore()
    const { university } = useUniversityStore()
    const navigate = useNavigate()

    const [activeTopTab, setActiveTopTab] = useState('available')
    const [slots, setSlots] = useState([])
    const [myAppointments, setMyAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [search, setSearch] = useState('')

    const [selectedGroupKey, setSelectedGroupKey] = useState(null)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [booking, setBooking] = useState(false)

    const primaryColor = university?.primaryColor || '#4f46e5'

    const load = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true)
        try {
            const [slotsRes, apptsRes] = await Promise.all([
                api.get('/api/user/appointments/available').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/appointments').catch(() => ({ data: { data: [] } })),
            ])

            const fetchedSlots = slotsRes.data?.data || []
            setSlots(fetchedSlots)
            setMyAppointments(apptsRes.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load data' })
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [push])

    useAdaptivePoll(() => load(false), { fastMs: 5000, slowMs: 15000 })

    // Group slots by officeName (which is what backend sends)
    const slotGroups = useMemo(() => {
        const groups = new Map()
        slots.forEach(slot => {
            const key = slot.officeName || slot.category || 'General Appointments'
            if (!groups.has(key)) {
                groups.set(key, {
                    key,
                    name: key,
                    location: slot.location || 'Main Campus',
                    category: slot.category,
                    slots: [],
                    staff: new Map(),
                })
            }
            const g = groups.get(key)
            g.slots.push(slot)
            if (slot.staffId) {
                g.staff.set(slot.staffId, {
                    id: slot.staffId,
                    name: slot.staffName,
                    role: slot.staffRole
                })
            }
        })
        return Array.from(groups.values()).map(g => ({
            ...g,
            staff: Array.from(g.staff.values()),
        })).sort((a, b) => a.name.localeCompare(b.name))
    }, [slots])

    const filteredGroups = useMemo(() => {
        if (!search.trim()) return slotGroups
        const s = search.toLowerCase()
        return slotGroups.filter(g =>
            g.name.toLowerCase().includes(s) ||
            g.location?.toLowerCase().includes(s) ||
            g.slots.some(slot =>
                slot.title?.toLowerCase().includes(s) ||
                slot.description?.toLowerCase().includes(s)
            )
        )
    }, [slotGroups, search])

    useEffect(() => {
        setSelectedSlot(null)
    }, [selectedGroupKey])

    const selectedGroup = filteredGroups.find(g => g.key === selectedGroupKey)

    const allSlotsInGroup = selectedGroup?.slots || []

    const uniqueDates = useMemo(() => {
        const dates = allSlotsInGroup.map(s => s.startTime?.split('T')[0]).filter(Boolean)
        return [...new Set(dates)].sort()
    }, [allSlotsInGroup])

    const [selectedDate, setSelectedDate] = useState('')
    useEffect(() => {
        setSelectedDate(uniqueDates[0] || '')
    }, [uniqueDates])

    const availableSlotsForDate = useMemo(() => {
        if (!selectedDate) return allSlotsInGroup
        return allSlotsInGroup.filter(s => s.startTime?.startsWith(selectedDate))
    }, [allSlotsInGroup, selectedDate])

    const handleBookAppointment = async (slotToBook) => {
        if (!slotToBook) return
        setBooking(true)
        try {
            await api.post('/api/user/appointments/book', { slotId: slotToBook.id })
            push({ type: 'success', message: `Appointment booked for ${formatSlotDate(slotToBook.startTime)}` })
            setActiveTopTab('mine')
            await load(false)
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to book appointment' })
        } finally {
            setBooking(false)
        }
    }

    const upcomingAppointments = useMemo(() => {
        return myAppointments.filter(a => ['BOOKED', 'CONFIRMED'].includes(a.status))
    }, [myAppointments])

    const pastAppointments = useMemo(() => {
        return myAppointments.filter(a => !['BOOKED', 'CONFIRMED'].includes(a.status))
    }, [myAppointments])

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-950 min-h-screen -m-4 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8">
            <div className="max-w-[1600px] mx-auto pb-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments</h1>
                        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
                            Book appointments with university staff. Choose from available slots created by staff members.
                        </p>
                    </div>

                    <a
                        href="mailto:support@uniqueue.com"
                        className="hidden md:flex items-center gap-3 rounded-xl border px-4 py-3 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer bg-white"
                        style={{ borderColor: withAlpha(primaryColor, 0.3), boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}>
                            <HelpCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900">Need help?</div>
                            <div className="text-xs font-medium text-slate-500">Contact our support team</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 ml-2" />
                    </a>
                </div>

                {/* Top Tabs */}
                <div className="inline-flex items-center gap-1 p-1 mb-6 bg-slate-50 border border-slate-200 rounded-xl">
                    {[
                        { id: 'available', label: 'Available Appointments', icon: Calendar },
                        { id: 'mine', label: 'My Appointments', icon: UserCircle2 },
                        { id: 'history', label: 'Appointment History', icon: Clock },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTopTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTopTab === tab.id ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            style={activeTopTab === tab.id ? { color: primaryColor } : undefined}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                {activeTopTab === 'available' && (
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">

                        {/* LEFT COLUMN: Slot Groups */}
                        <div className="space-y-4 lg:sticky lg:top-24">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by office or service..."
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2"
                                        style={{ '--tw-ring-color': withAlpha(primaryColor, 0.2) }}
                                    />
                                </div>
                                <button
                                    onClick={() => load(true)}
                                    disabled={refreshing}
                                    title="Refresh slots"
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors shrink-0 disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {filteredGroups.length === 0 ? (
                                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                    <AlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                    <p className="text-sm font-bold text-slate-600">No appointments available</p>
                                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                                        No staff has created appointment slots yet. Please check back later.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredGroups.map(group => {
                                        const isSelected = selectedGroupKey === group.key
                                        const Icon = getCategoryIcon(group.category, group.name)
                                        const totalSlots = group.slots.length

                                        return (
                                            <button
                                                key={group.key}
                                                type="button"
                                                onClick={() => setSelectedGroupKey(group.key)}
                                                className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 border bg-white dark:bg-slate-900 ${
                                                    isSelected ? 'border-2 shadow-md' : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                                style={isSelected ? { borderColor: primaryColor, backgroundColor: withAlpha(primaryColor, 0.02) } : undefined}
                                            >
                                                <div
                                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                                                    style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                                                >
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{group.name}</h3>
                                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                                                {totalSlots} slot{totalSlots !== 1 ? 's' : ''} available · {group.staff.length} staff
                                                            </p>
                                                        </div>

                                                        <Badge variant="success" className="shrink-0 flex items-center gap-1 whitespace-nowrap text-[10px] px-2 py-0.5">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            {totalSlots} Slot{totalSlots !== 1 ? 's' : ''}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN */}
                        <div>
                            {selectedGroup ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={selectedGroup.key}>
                                    <Card padded={false} className="overflow-hidden shadow-sm bg-white border-slate-200 rounded-2xl">

                                        {/* Hero Header */}
                                        <div className="p-6 sm:p-8" style={{ backgroundColor: withAlpha(primaryColor, 0.03), borderBottom: `1px solid ${withAlpha(primaryColor, 0.1)}` }}>
                                            <div className="flex items-start gap-5">
                                                <div
                                                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5"
                                                    style={{ color: primaryColor }}
                                                >
                                                    {(() => { const Icon = getCategoryIcon(selectedGroup.category, selectedGroup.name); return <Icon className="h-8 w-8" /> })()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-2xl font-bold text-slate-900">
                                                            {selectedGroup.name}
                                                        </h2>
                                                        <Badge variant="success" className="text-xs px-2 py-0.5 whitespace-nowrap">
                                                            {selectedGroup.slots.length} Slot{selectedGroup.slots.length !== 1 ? 's' : ''}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 text-sm font-medium text-slate-600">
                                                        {university?.name || 'University Portal'} {university?.code ? `(${university.code})` : ''}
                                                    </p>
                                                    {selectedGroup.location && (
                                                        <p className="mt-2 text-sm text-slate-600 flex items-center gap-1.5">
                                                            <MapPin className="h-4 w-4 text-slate-400" />
                                                            {selectedGroup.location}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100 bg-white">
                                            <div className="flex items-start gap-3 p-4">
                                                <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-900 line-clamp-1">{selectedGroup.location}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-4">
                                                <Calendar className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-900 whitespace-nowrap">
                                                        {selectedGroup.category?.replace('_', ' ') || 'General'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-4">
                                                <Users className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Staff</div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-900 whitespace-nowrap">
                                                        {selectedGroup.staff.length} member{selectedGroup.staff.length !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Staff Details */}
                                        <div className="p-6 border-b border-slate-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-slate-400" /> Staff Details
                                                </h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {selectedGroup.staff.map(staff => (
                                                    <div key={staff.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: primaryColor }}>
                                                            {staff.name?.charAt(0) || 'S'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-slate-900 truncate">{staff.name}</div>
                                                            <div className="text-xs text-slate-500 mt-1">{staff.role || 'Staff'}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 👇 PREMIUM BOOKING SECTION */}
                                        <div className="p-6 bg-slate-50/50">
                                            <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" /> Available Slots
                                            </h4>

                                            <div className="space-y-6">
                                                {/* Date tabs */}
                                                {uniqueDates.length > 1 && (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {uniqueDates.map(date => (
                                                            <button
                                                                key={date}
                                                                onClick={() => {
                                                                    setSelectedDate(date)
                                                                    setSelectedSlot(null)
                                                                }}
                                                                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                                                                    selectedDate === date
                                                                        ? 'text-white shadow-sm'
                                                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                                style={selectedDate === date ? { backgroundColor: primaryColor } : undefined}
                                                            >
                                                                {formatSlotDate(date)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* 👇 PREMIUM SLOTS LIST */}
                                                <div className="space-y-3">
                                                    {availableSlotsForDate.map(slot => {
                                                        const isFull = slot.status === 'FULL'
                                                        const isSelected = selectedSlot?.id === slot.id

                                                        return (
                                                            <div
                                                                key={slot.id}
                                                                className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border bg-white transition-all duration-200 ${
                                                                    isFull
                                                                        ? 'opacity-60 border-slate-200'
                                                                        : 'hover:border-slate-300 hover:shadow-md cursor-pointer'
                                                                }`}
                                                                style={isSelected ? { borderColor: primaryColor, boxShadow: `0 0 0 2px ${withAlpha(primaryColor, 0.2)}` } : { borderColor: '#e2e8f0' }}
                                                                onClick={() => !isFull && setSelectedSlot(slot)}
                                                            >
                                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                                    <div
                                                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                                                            isFull ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                                                                        }`}
                                                                        style={!isFull ? { '--tw-bg-opacity': 1 } : undefined}
                                                                    >
                                                                        <Calendar className="h-6 w-6" />
                                                                    </div>

                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <h5 className="text-base font-bold text-slate-900 truncate">
                                                                                {slot.title}
                                                                            </h5>
                                                                            <Badge variant={slot.remaining > 0 ? 'success' : 'danger'} className="text-[10px] px-1.5 py-0">
                                                                                {slot.remaining} / {slot.capacity} left
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                                                                            {slot.description || 'Standard appointment'}
                                                                        </p>

                                                                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-600">
                                                                            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                                {formatSlotDate(slot.startTime)}
                                                                            </span>
                                                                            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                                                {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
                                                                            </span>
                                                                            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                                                {slot.location || selectedGroup.location}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="shrink-0 flex items-center justify-end sm:pl-4 sm:border-l sm:border-slate-100 sm:mt-0 mt-4">
                                                                    {isFull ? (
                                                                        <span className="text-xs font-bold text-slate-400 uppercase px-4 py-2">FULL</span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setSelectedSlot(slot)
                                                                                handleBookAppointment(slot)
                                                                            }}
                                                                            disabled={booking && isSelected}
                                                                            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                                                                            style={{ backgroundColor: primaryColor }}
                                                                        >
                                                                            {booking && isSelected ? (
                                                                                'Booking...'
                                                                            ) : (
                                                                                <>
                                                                                    <CalendarPlus className="h-4 w-4" /> Book Now
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
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
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Select a group to view appointments</h3>
                                        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                                            Pick an appointment group from the left to see available time slots.
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* MY APPOINTMENTS */}
                {activeTopTab === 'mine' && (
                    <Card className="bg-white border-slate-200 rounded-2xl max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <UserCircle2 className="h-5 w-5 text-slate-400" />
                            <h2 className="text-lg font-bold text-slate-900">My Appointments</h2>
                        </div>

                        {upcomingAppointments.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <Calendar className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">No upcoming appointments</p>
                                <p className="mt-1 text-xs text-slate-500">Book a slot from the Available tab to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingAppointments.map(appt => (
                                    <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl gap-4 hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}>
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">{appt.slotTitle || appt.serviceName || 'Appointment'}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {appt.staffName} • {appt.slotStartTime ? formatSlotDate(appt.slotStartTime) : appt.date} at {appt.slotStartTime ? formatSlotTime(appt.slotStartTime) : appt.time}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={appt.status === 'CONFIRMED' ? 'success' : 'warning'}>{appt.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {/* APPOINTMENT HISTORY */}
                {activeTopTab === 'history' && (
                    <Card className="bg-white border-slate-200 rounded-2xl max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="h-5 w-5 text-slate-400" />
                            <h2 className="text-lg font-bold text-slate-900">Appointment History</h2>
                        </div>

                        {pastAppointments.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <Clock className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">No past appointments</p>
                                <p className="mt-1 text-xs text-slate-500">Your completed or cancelled appointments will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pastAppointments.map(appt => (
                                    <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl gap-4 bg-slate-50/50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">{appt.slotTitle || appt.serviceName || 'Appointment'}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {appt.staffName} • {appt.slotStartTime ? formatSlotDate(appt.slotStartTime) : appt.date}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={
                                                   appt.status === 'COMPLETED' ? 'success' :
                                                       appt.status === 'CANCELLED' ? 'danger' : 'default'
                                               }>
                                            {appt.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    )
}