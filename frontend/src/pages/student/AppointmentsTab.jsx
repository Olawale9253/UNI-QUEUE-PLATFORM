import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, Clock, MapPin, Phone, Search, Filter, ChevronRight,
    Building2, Users, CheckCircle2, HelpCircle, Ticket, GraduationCap,
    FileText, Monitor, Banknote, UserCircle2, ArrowRight, Info, ChevronDown
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { withAlpha } from '../../lib/colors'

// Helper to pick a nice icon based on office name
function getOfficeIcon(name) {
    const n = (name || '').toLowerCase()
    if (n.includes('academic')) return GraduationCap
    if (n.includes('bursary') || n.includes('finance')) return Banknote
    if (n.includes('registry')) return FileText
    if (n.includes('student')) return Users
    if (n.includes('ict') || n.includes('computer')) return Monitor
    return Building2
}

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM']
const DATES = [
    { value: 'today', label: 'Today - Fri, 31 Oct 2026' },
    { value: 'tomorrow', label: 'Tomorrow - Sat, 01 Nov 2026' },
    { value: 'monday', label: 'Monday - Mon, 03 Nov 2026' }
]

export default function AppointmentsTab() {
    const { push } = useToastStore()
    const { user } = useAuthStore()
    const { university } = useUniversityStore()
    const navigate = useNavigate()

    const [activeTopTab, setActiveTopTab] = useState('available')
    const [offices, setOffices] = useState([])
    const [myAppointments, setMyAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedOffice, setSelectedOffice] = useState(null)

    // Booking state
    const [selectedDate, setSelectedDate] = useState('today')
    const [selectedTime, setSelectedTime] = useState('10:00 AM')
    const [selectedService, setSelectedService] = useState(null)
    const [booking, setBooking] = useState(false)

    const primaryColor = university?.primaryColor || '#4f46e5'

    const load = useCallback(async () => {
        try {
            const [officesRes, apptsRes, queuesRes] = await Promise.all([
                api.get('/api/offices').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/appointments').catch(() => ({ data: { data: [] } })),
                api.get('/api/queues').catch(() => ({ data: { data: [] } }))
            ])

            const qs = queuesRes.data?.data || []
            const os = officesRes.data?.data || []

            const enrichedOffices = os.map(office => {
                const services = qs.filter(q =>
                    (q.officeId && office.id && String(q.officeId) === String(office.id)) ||
                    (q.officeName === office.name)
                )
                const staffMap = new Map()
                services.forEach(s => (s.staff || []).forEach(st => staffMap.set(st.id, st)))

                return {
                    ...office,
                    services,
                    staff: Array.from(staffMap.values()),
                    isAvailable: office.isActive !== false
                }
            })

            setOffices(enrichedOffices.sort((a, b) => a.name.localeCompare(b.name)))
            setMyAppointments(apptsRes.data?.data || [])

            if (enrichedOffices.length > 0 && !selectedOffice) {
                setSelectedOffice(enrichedOffices[0])
            }
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load data' })
        } finally {
            setLoading(false)
        }
    }, [push, selectedOffice])

    useEffect(() => { load() }, [load])

    const filteredOffices = useMemo(() => {
        if (!search.trim()) return offices
        const s = search.toLowerCase()
        return offices.filter(o =>
            o.name.toLowerCase().includes(s) ||
            o.description?.toLowerCase().includes(s) ||
            o.services.some(srv => srv.name.toLowerCase().includes(s))
        )
    }, [offices, search])

    const handleBookAppointment = async (serviceToBook) => {
        if (!selectedOffice || !serviceToBook || !selectedTime) {
            push({ type: 'error', message: 'Please select a time slot first' })
            return
        }
        setBooking(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 800)) // Simulate API
            push({ type: 'success', message: `Appointment booked for ${serviceToBook.name} at ${selectedTime}` })
            setActiveTopTab('mine')

            // Refresh
            const apptsRes = await api.get('/api/user/appointments').catch(() => ({ data: { data: [] } }))
            setMyAppointments(apptsRes.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to book appointment' })
        } finally {
            setBooking(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen -m-4 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8">
            <div className="max-w-[1600px] mx-auto pb-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments</h1>
                        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
                            Book or join appointments with university offices and staff. Choose from available slots, or join an existing appointment queue.
                        </p>
                    </div>

                    <div
                        className="hidden md:flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                        style={{ borderColor: withAlpha(primaryColor, 0.2), backgroundColor: withAlpha(primaryColor, 0.05) }}
                        onClick={() => push({ type: 'info', message: 'Contact support at support@uniqueue.com' })}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm" style={{ color: primaryColor }}>
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900">Need help?</div>
                            <div className="text-xs font-medium text-slate-500">Check office details or contact support.</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 ml-2" />
                    </div>
                </div>

                {/* Top Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 pb-px">
                    {[
                        { id: 'available', label: 'Available Appointments', icon: Calendar },
                        { id: 'mine', label: 'My Appointments', icon: UserCircle2 },
                        { id: 'history', label: 'Appointment History', icon: Clock },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTopTab(tab.id)}
                            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                                activeTopTab === tab.id ? '' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'
                            }`}
                            style={activeTopTab === tab.id ? { color: primaryColor } : undefined}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {activeTopTab === tab.id && (
                                <motion.div layoutId="topTab" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: primaryColor }} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                {activeTopTab === 'available' && (
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.2fr]">

                        {/* LEFT: Office List */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by office, service or staff..."
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2"
                                        style={{ '--tw-ring-color': withAlpha(primaryColor, 0.2) }}
                                    />
                                </div>
                                <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                                    <Filter className="h-4 w-4 text-slate-400" /> All Offices
                                </button>
                            </div>

                            {filteredOffices.length === 0 ? (
                                <EmptyState icon={Search} title="No offices found" description="Try a different search term." />
                            ) : (
                                <div className="space-y-3">
                                    {filteredOffices.map(office => {
                                        const isSelected = selectedOffice?.id === office.id
                                        const Icon = getOfficeIcon(office.name)
                                        return (
                                            <Card
                                                key={office.id}
                                                className={`cursor-pointer transition-all ${
                                                    isSelected ? 'shadow-sm border-2' : 'border hover:border-slate-300'
                                                }`}
                                                style={isSelected ? { borderColor: primaryColor } : undefined}
                                                onClick={() => setSelectedOffice(office)}
                                            >
                                                <div className="flex items-start gap-4 p-1">
                                                    <div
                                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                                                        style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                                                    >
                                                        <Icon className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h3 className="text-base font-bold text-slate-900">{office.name}</h3>
                                                                <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{office.description || 'View available services and book an appointment.'}</p>
                                                            </div>
                                                            <Badge variant={office.isAvailable ? 'success' : 'default'} className="shrink-0 flex items-center gap-1">
                                                                {office.isAvailable && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                                                {office.isAvailable ? 'Available' : 'Closed'}
                                                            </Badge>
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-slate-500">
                                                            <div className="flex items-center gap-4">
                                                                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Today - Fri, 31 Oct 2026</span>
                                                                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" /> 9:00 AM – 4:00 PM</span>
                                                            </div>

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedOffice(office); }}
                                                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
                                                                style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                                                            >
                                                                View Details <ChevronRight className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Selected Office Details */}
                        <div className="sticky top-24">
                            {selectedOffice ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={selectedOffice.id}>
                                    <Card padded={false} className="overflow-hidden shadow-sm bg-white border-slate-200">
                                        {/* Hero */}
                                        <div className="p-6 sm:p-8" style={{ backgroundColor: withAlpha(primaryColor, 0.02) }}>
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5"
                                                    style={{ color: primaryColor }}
                                                >
                                                    {(() => { const Icon = getOfficeIcon(selectedOffice.name); return <Icon className="h-8 w-8" /> })()}
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                                        {selectedOffice.name}
                                                        <Badge variant={selectedOffice.isAvailable ? 'success' : 'default'} className="text-xs px-2 py-0.5">
                                                            {selectedOffice.isAvailable ? 'Available' : 'Closed'}
                                                        </Badge>
                                                    </h2>
                                                    <p className="mt-1 text-sm font-medium text-slate-600">
                                                        {university?.name || 'University Portal'} {university?.code ? `(${university.code})` : ''}
                                                    </p>
                                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                        {selectedOffice.description || 'Handles course registration, academic records, transcripts, result checking and other academic related services.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3-Column Info Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-y border-slate-100 bg-white">
                                            <div className="flex items-start gap-3 p-4">
                                                <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-900">{selectedOffice.location || 'Main Administrative Building, Ground Floor'}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-4">
                                                <Phone className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone Number</div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-900">+234 803 123 4567</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-4">
                                                <Clock className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Working Hours</div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-900">Mon – Fri: 8:00 AM – 4:00 PM</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sub Tabs */}
                                        <div className="px-6 pt-6">
                                            <div className="flex items-center gap-6 border-b border-slate-200">
                                                <button className="pb-3 text-sm font-bold border-b-2 flex items-center gap-2" style={{ borderColor: primaryColor, color: primaryColor }}>
                                                    <Calendar className="h-4 w-4" /> Available Appointments
                                                </button>
                                                <button className="pb-3 text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-2">
                                                    <Users className="h-4 w-4" /> Staff Members
                                                </button>
                                            </div>
                                        </div>

                                        {/* Booking Area */}
                                        <div className="p-6 space-y-6">
                                            {/* Date & Time Selector */}
                                            <div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-semibold text-slate-700">Select Date</span>

                                                    <div className="relative">
                                                        <select
                                                            className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-10 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2"
                                                            value={selectedDate}
                                                            onChange={(e) => setSelectedDate(e.target.value)}
                                                            style={{ '--tw-ring-color': withAlpha(primaryColor, 0.2) }}
                                                        >
                                                            {DATES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                                        </select>
                                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {TIME_SLOTS.map(time => (
                                                        <button
                                                            key={time}
                                                            onClick={() => setSelectedTime(time)}
                                                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                                                selectedTime === time
                                                                    ? 'text-white shadow-sm'
                                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                            style={selectedTime === time ? { backgroundColor: primaryColor } : undefined}
                                                        >
                                                            {time}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Services */}
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 mb-3">Available Services</h4>
                                                <div className="space-y-3">
                                                    {selectedOffice.services.length === 0 ? (
                                                        <p className="text-sm text-slate-500 italic">No appointment-based services offered here.</p>
                                                    ) : (
                                                        selectedOffice.services.map((service) => (
                                                            <div
                                                                key={service.id}
                                                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                                                    selectedService?.id === service.id
                                                                        ? 'bg-slate-50 shadow-sm'
                                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                                }`}
                                                                style={selectedService?.id === service.id ? { borderColor: primaryColor, boxShadow: '0 0 0 1px ' + withAlpha(primaryColor, 0.5) } : undefined}
                                                                onClick={() => setSelectedService(service)}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div
                                                                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                                                        style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                                                                    >
                                                                        <FileText className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-slate-900">{service.name}</div>
                                                                        <div className="text-xs text-slate-500 mt-0.5">{service.description || 'Standard appointment service.'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                                                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                                                        <Clock className="h-3.5 w-3.5" /> {service.averageServiceMinutes || 20} mins
                                                                    </span>

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedService(service);
                                                                            handleBookAppointment(service);
                                                                        }}
                                                                        disabled={booking}
                                                                        className="rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                                                                        style={{ backgroundColor: primaryColor }}
                                                                    >
                                                                        {booking ? 'Booking...' : 'Book Appointment'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Banner */}
                                        <div className="p-6 bg-slate-50 border-t border-slate-100 mt-4">
                                            <div
                                                className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border p-4"
                                                style={{ backgroundColor: withAlpha(primaryColor, 0.05), borderColor: withAlpha(primaryColor, 0.15) }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm" style={{ color: primaryColor }}>
                                                        <HelpCircle className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900">Can't find what you need?</div>
                                                        <div className="text-xs text-slate-600 font-medium">You can also join the office queue for walk-in services.</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => navigate('/student/queues')}
                                                    className="shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                                                    style={{ backgroundColor: primaryColor }}
                                                >
                                                    <Ticket className="h-4 w-4" /> Join Queue
                                                </button>
                                            </div>
                                        </div>

                                    </Card>
                                </motion.div>
                            ) : (
                                <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed border-2 bg-slate-50/50">
                                    <EmptyState
                                        icon={Info}
                                        variant="info"
                                        size="lg"
                                        bordered={false}
                                        title="Select an office to view appointments"
                                        description="Pick an office from the list on the left to see available dates, times, and services."
                                    />
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* My Appointments / History Tabs */}
                {(activeTopTab === 'mine' || activeTopTab === 'history') && (
                    <Card className="bg-white border-slate-200">
                        <div className="flex items-center gap-2 mb-6">
                            {activeTopTab === 'mine' ? <UserCircle2 className="h-5 w-5 text-slate-400" /> : <Clock className="h-5 w-5 text-slate-400" />}
                            <h2 className="text-lg font-bold text-slate-900">
                                {activeTopTab === 'mine' ? 'My Appointments' : 'Appointment History'}
                            </h2>
                        </div>

                        {myAppointments.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <Calendar className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">No appointments yet</p>
                                <p className="mt-1 text-xs text-slate-500">Book a slot from the Available tab to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myAppointments.map(appt => (
                                    <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">{appt.serviceName || 'Appointment'}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{appt.officeName} • {appt.date} at {appt.time}</div>
                                            </div>
                                        </div>
                                        <Badge variant={appt.status === 'CONFIRMED' ? 'success' : 'warning'}>{appt.status}</Badge>
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