import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Calendar, Clock, Building2, MapPin, User, Copy, Check,
    CalendarCheck, AlertCircle, Info,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

const STATUS_VARIANTS = {
    BOOKED: 'info',
    CONFIRMED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'default',
    NO_SHOW: 'danger',
}

const STATUS_LABELS = {
    BOOKED: 'Awaiting meeting',
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'Missed',
}

function formatDate(iso) {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return '—'
    }
}

function formatDateTime(iso) {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
    } catch {
        return '—'
    }
}

function formatTimeOnly(iso) {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
    } catch {
        return '—'
    }
}

function dateKey(iso) {
    if (!iso) return ''
    return String(iso).slice(0, 10)
}

function generateReference(appt) {
    if (!appt) return '—'
    const dateValue = appt.bookedAt ? new Date(appt.bookedAt) : new Date()
    const yyyy = dateValue.getFullYear()
    const mm = String(dateValue.getMonth() + 1).padStart(2, '0')
    const dd = String(dateValue.getDate()).padStart(2, '0')
    const idPart = String(appt.id || 0).padStart(4, '0')
    return `APP${yyyy}${mm}${dd}${idPart}`
}

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false)
    const copy = async (event) => {
        event.stopPropagation()
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
            title="Copy reference"
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
            {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
                <Copy className="h-3.5 w-3.5" />
            )}
        </button>
    )
}

export default function AppointmentsTab() {
    const { push } = useToastStore()
    const [slots, setSlots] = useState([])
    const [mine, setMine] = useState([])
    const [offices, setOffices] = useState([])
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [booking, setBooking] = useState(false)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [cancelling, setCancelling] = useState(false)

    // Form
    const [selectedOfficeId, setSelectedOfficeId] = useState('')
    const [selectedServiceId, setSelectedServiceId] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedSlotId, setSelectedSlotId] = useState('')
    const [notes, setNotes] = useState('')

    const load = useCallback(async () => {
        try {
            const [stringValue, message, office, queue] = await Promise.all([
                api.get('/api/user/appointments/available').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/appointments').catch(() => ({ data: { data: [] } })),
                api.get('/api/offices').catch(() => ({ data: { data: [] } })),
                api.get('/api/queues').catch(() => ({ data: { data: [] } })),
            ])
            setSlots(stringValue.data?.data || [])
            setMine(message.data?.data || [])
            setOffices(office.data?.data || [])
            setServices(queue.data?.data || [])
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 10000, slowMs: 30000 })

    // ─── Office options: real offices + any queue-derived fallback ───
    const officeOptions = useMemo(() => {
        const map = new Map()
        offices.forEach((office) => {
            if (office.isActive === false) return
            map.set(String(office.id), { id: String(office.id), name: office.name })
        })
        services.forEach((service) => {
            if (!service.officeId) return
            const key = String(service.officeId)
            if (!map.has(key)) {
                map.set(key, { id: key, name: service.officeName || 'General' })
            }
        })
        return Array.from(map.values()).sort((firstValue, secondValue) => firstValue.name.localeCompare(secondValue.name))
    }, [offices, services])

    // ─── Services in selected office ───
    const serviceOptions = useMemo(() => {
        if (!selectedOfficeId) return []
        return services
            .filter((service) => String(service.officeId) === String(selectedOfficeId) && service.isActive !== false)
            .map((queue) => ({ id: String(queue.id), name: queue.name }))
            .sort((firstValue, secondValue) => firstValue.name.localeCompare(secondValue.name))
    }, [services, selectedOfficeId])

    const selectedService = useMemo(
        () => services.find((service) => String(service.id) === String(selectedServiceId)) || null,
        [services, selectedServiceId]
    )

    // ─── Slots matching the current selection ───
    const matchingSlots = useMemo(() => {
        if (!selectedService) return []
        const svcName = (selectedService.name || '').toLowerCase()
        const officeName = (selectedService.officeName || '').toLowerCase()
        return slots.filter((sl) => {
            const token = (sl.title || '').toLowerCase()
            const office = (sl.officeName || sl.department || sl.faculty || '').toLowerCase()
            return token === svcName && (!officeName || office === officeName || !office)
        })
    }, [slots, selectedService])

    const dateOptions = useMemo(() => {
        const set = new Set()
        matchingSlots.forEach((matchingSlot) => {
            const key = dateKey(matchingSlot.startTime)
            if (key) set.add(key)
        })
        return Array.from(set).sort()
    }, [matchingSlots])

    const timeSlots = useMemo(() => {
        if (!selectedDate) return []
        return matchingSlots
            .filter((matchingSlot) => dateKey(matchingSlot.startTime) === selectedDate)
            .sort((firstValue, secondValue) => (firstValue.startTime || '').localeCompare(secondValue.startTime || ''))
    }, [matchingSlots, selectedDate])

    const selectedSlot = useMemo(
        () => timeSlots.find((timeSlot) => String(timeSlot.id) === String(selectedSlotId)) || null,
        [timeSlots, selectedSlotId]
    )

    // Reset downstream on upstream changes
    useEffect(() => {
        setSelectedServiceId('')
        setSelectedDate('')
        setSelectedSlotId('')
    }, [selectedOfficeId])

    useEffect(() => {
        setSelectedDate('')
        setSelectedSlotId('')
    }, [selectedServiceId])

    useEffect(() => {
        setSelectedSlotId('')
    }, [selectedDate])

    // ─── Upcoming appointment guard ───
    const upcomingAppointments = useMemo(
        () =>
            mine.filter(
                (item) =>
                    (item.status === 'BOOKED' || item.status === 'CONFIRMED') &&
                    item.startTime &&
                    new Date(item.startTime).getTime() > Date.now()
            ),
        [mine]
    )
    const hasUpcoming = upcomingAppointments.length > 0

    // ─── Actions ───
    const book = async () => {
        if (hasUpcoming) {
            push({ type: 'error', message: 'You already have an upcoming appointment' })
            return
        }
        if (!selectedSlot) {
            push({ type: 'error', message: 'Pick a time slot first' })
            return
        }
        setBooking(true)
        try {
            await api.post('/api/user/appointments/book', {
                slotId: selectedSlot.id,
                notes: notes.trim() || null,
            })
            push({ type: 'success', message: `Booked: ${selectedSlot.title}` })
            setSelectedOfficeId('')
            setSelectedServiceId('')
            setSelectedDate('')
            setSelectedSlotId('')
            setNotes('')
            await load()
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to book',
            })
        } finally {
            setBooking(false)
        }
    }

    const cancel = async () => {
        if (!cancelTarget) return
        setCancelling(true)
        try {
            await api.post(`/api/user/appointments/${cancelTarget.id}/cancel`)
            push({ type: 'success', message: 'Appointment cancelled' })
            setCancelTarget(null)
            await load()
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to cancel',
            })
        } finally {
            setCancelling(false)
        }
    }

    const sortedMine = useMemo(() => {
        const now = Date.now()
        return [...mine].sort((firstValue, secondValue) => {
            const at = firstValue.startTime ? new Date(firstValue.startTime).getTime() : 0
            const bt = secondValue.startTime ? new Date(secondValue.startTime).getTime() : 0
            const aFuture = at > now
            const bFuture = bt > now
            if (aFuture && !bFuture) return -1
            if (!aFuture && bFuture) return 1
            return aFuture ? at - bt : bt - at
        })
    }, [mine])

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
                <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
        )
    }

    return (
        <div>
            <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Appointments
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Book 1-on-1 slots with staff and track your bookings.
                </p>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[360px_1fr]">
                {/* ═══ LEFT: Book Appointment ═══ */}
                <div className="lg:sticky lg:top-[150px]">
                    <Card className="h-fit">
                        <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                            Book Appointment
                        </h3>

                        {officeOptions.length === 0 ? (
                            <EmptyState
                                icon={Building2}
                                title="No offices available"
                                description="Your university hasn't set up any offices yet."
                            />
                        ) : (
                            <div className="space-y-3">
                                {hasUpcoming && (
                                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>
                      You have an upcoming appointment. Complete or cancel it
                      before booking another.
                    </span>
                                    </div>
                                )}

                                {/* Office */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Office
                                    </label>
                                    <select
                                        value={selectedOfficeId}
                                        onChange={(event) => setSelectedOfficeId(event.target.value)}
                                        disabled={hasUpcoming}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">Select Office</option>
                                        {officeOptions.map((officeOption) => (
                                            <option key={officeOption.id} value={officeOption.id}>
                                                {officeOption.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Service */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Service
                                    </label>
                                    <select
                                        value={selectedServiceId}
                                        onChange={(eventValue) => setSelectedServiceId(eventValue.target.value)}
                                        disabled={!selectedOfficeId || hasUpcoming}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">
                                            {!selectedOfficeId
                                                ? 'Pick an office first'
                                                : serviceOptions.length === 0
                                                    ? 'No services in this office'
                                                    : 'Select Service'}
                                        </option>
                                        {serviceOptions.map((serviceOption) => (
                                            <option key={serviceOption.id} value={serviceOption.id}>
                                                {serviceOption.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* No slots message */}
                                {selectedService && matchingSlots.length === 0 && (
                                    <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
                                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>
                      No slots published yet for <strong>{selectedService.name}</strong>.
                      Check back soon — staff publish new slots regularly.
                    </span>
                                    </div>
                                )}

                                {/* Date */}
                                {selectedService && matchingSlots.length > 0 && (
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                            Date
                                        </label>
                                        <select
                                            value={selectedDate}
                                            onChange={(eventValue2) => setSelectedDate(eventValue2.target.value)}
                                            disabled={hasUpcoming}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            <option value="">Select Date</option>
                                            {dateOptions.map((dateOption) => (
                                                <option key={dateOption} value={dateOption}>
                                                    {formatDate(dateOption)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Time */}
                                {selectedDate && (
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                            Time
                                        </label>
                                        <select
                                            value={selectedSlotId}
                                            onChange={(eventValue3) => setSelectedSlotId(eventValue3.target.value)}
                                            disabled={hasUpcoming}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            <option value="">Select Time</option>
                                            {timeSlots.map((timeSlot) => (
                                                <option key={timeSlot.id} value={timeSlot.id}>
                                                    {formatTimeOnly(timeSlot.startTime)} — {timeSlot.remaining} left
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Preview */}
                                {selectedSlot && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/50"
                                    >
                                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                                            {selectedSlot.title}
                                        </div>
                                        <div className="mt-1.5 space-y-1 text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3 w-3" />
                                                {formatTimeOnly(selectedSlot.startTime)} –{' '}
                                                {formatTimeOnly(selectedSlot.endTime)}
                                            </div>
                                            {selectedSlot.staffName && (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3 w-3" />
                                                    {selectedSlot.staffName}
                                                    {selectedSlot.staffRole && ` · ${selectedSlot.staffRole}`}
                                                </div>
                                            )}
                                            {selectedSlot.location && (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3 w-3" />
                                                    {selectedSlot.roomDetail
                                                        ? `${selectedSlot.location} · ${selectedSlot.roomDetail}`
                                                        : selectedSlot.location}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Notes */}
                                {selectedSlot && (
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                            Note for the host{' '}
                                            <span className="font-normal text-slate-400">(optional)</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={notes}
                                            onChange={(eventValue4) => setNotes(eventValue4.target.value)}
                                            placeholder="What would you like to discuss?"
                                            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                                        />
                                    </div>
                                )}

                                <Button
                                    onClick={book}
                                    loading={booking}
                                    disabled={booking || hasUpcoming || !selectedSlot}
                                    fullWidth
                                    className="!mt-4"
                                >
                                    {hasUpcoming
                                        ? 'You have an appointment already'
                                        : booking
                                            ? 'Booking…'
                                            : 'Book Appointment'}
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>

                {/* ═══ RIGHT: My Appointments ═══ */}
                <Card>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <CalendarCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                My Appointments
                            </h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {sortedMine.length}
            </span>
                    </div>

                    {sortedMine.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <Calendar className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                No appointments yet
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Book a slot from the left to get started.
                            </p>
                        </div>
                    ) : (
                        <ul className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
                            {sortedMine.map((item) => {
                                const reference = generateReference(item)
                                const isUpcoming =
                                    item.status === 'BOOKED' || item.status === 'CONFIRMED'
                                const officeName = item.officeName || item.slotTitle || 'Appointment'

                                return (
                                    <motion.li
                                        key={item.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`rounded-lg border p-4 transition-colors ${
                                            isUpcoming
                                                ? 'border-brand-200 bg-gradient-to-br from-brand-50/40 to-white dark:border-brand-900 dark:from-brand-950/20 dark:to-slate-900'
                                                : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    {officeName}
                                                </h4>

                                                {item.slotTitle && item.slotTitle !== officeName && (
                                                    <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                                                        {item.slotTitle}
                                                    </p>
                                                )}

                                                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    <span>{formatDateTime(item.startTime)}</span>
                                                </div>

                                                {item.staffName && (
                                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                        <User className="h-3 w-3 shrink-0" />
                                                        {item.staffName}
                                                    </div>
                                                )}

                                                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Reference:
                          </span>
                                                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {reference}
                          </span>
                                                    <CopyButton text={reference} />
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-col items-end gap-2">
                                                <Badge variant={STATUS_VARIANTS[item.status] || 'default'}>
                                                    {STATUS_LABELS[item.status] || item.status}
                                                </Badge>

                                                {isUpcoming && (
                                                    <button
                                                        onClick={() => setCancelTarget(item)}
                                                        className="rounded-md px-2 py-1 text-xs text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.li>
                                )
                            })}
                        </ul>
                    )}
                </Card>
            </div>

            <ConfirmDialog
                open={!!cancelTarget}
                onClose={() => !cancelling && setCancelTarget(null)}
                onConfirm={cancel}
                title="Cancel this appointment?"
                description={`${cancelTarget?.officeName || cancelTarget?.slotTitle || 'This appointment'} · ${formatDateTime(
                    cancelTarget?.startTime
                )}. The slot will be freed for other students.`}
                confirmLabel="Cancel appointment"
                cancelLabel="Keep it"
                variant="danger"
                loading={cancelling}
            />
        </div>
    )
}