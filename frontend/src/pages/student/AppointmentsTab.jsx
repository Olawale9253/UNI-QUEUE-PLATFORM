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
    const d = appt.bookedAt ? new Date(appt.bookedAt) : new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const idPart = String(appt.id || 0).padStart(4, '0')
    return `APP${yyyy}${mm}${dd}${idPart}`
}

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false)
    const copy = async (e) => {
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
            const [s, m, o, q] = await Promise.all([
                api.get('/api/user/appointments/available').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/appointments').catch(() => ({ data: { data: [] } })),
                api.get('/api/offices').catch(() => ({ data: { data: [] } })),
                api.get('/api/queues').catch(() => ({ data: { data: [] } })),
            ])
            setSlots(s.data?.data || [])
            setMine(m.data?.data || [])
            setOffices(o.data?.data || [])
            setServices(q.data?.data || [])
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
        offices.forEach((o) => {
            if (o.isActive === false) return
            map.set(String(o.id), { id: String(o.id), name: o.name })
        })
        services.forEach((q) => {
            if (!q.officeId) return
            const key = String(q.officeId)
            if (!map.has(key)) {
                map.set(key, { id: key, name: q.officeName || 'General' })
            }
        })
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
    }, [offices, services])

    // ─── Services in selected office ───
    const serviceOptions = useMemo(() => {
        if (!selectedOfficeId) return []
        return services
            .filter((q) => String(q.officeId) === String(selectedOfficeId) && q.isActive !== false)
            .map((q) => ({ id: String(q.id), name: q.name }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [services, selectedOfficeId])

    const selectedService = useMemo(
        () => services.find((s) => String(s.id) === String(selectedServiceId)) || null,
        [services, selectedServiceId]
    )

    // ─── Slots matching the current selection ───
    const matchingSlots = useMemo(() => {
        if (!selectedService) return []
        const svcName = (selectedService.name || '').toLowerCase()
        const officeName = (selectedService.officeName || '').toLowerCase()
        return slots.filter((sl) => {
            const t = (sl.title || '').toLowerCase()
            const o = (sl.officeName || sl.department || sl.faculty || '').toLowerCase()
            return t === svcName && (!officeName || o === officeName || !o)
        })
    }, [slots, selectedService])

    const dateOptions = useMemo(() => {
        const set = new Set()
        matchingSlots.forEach((s) => {
            const k = dateKey(s.startTime)
            if (k) set.add(k)
        })
        return Array.from(set).sort()
    }, [matchingSlots])

    const timeSlots = useMemo(() => {
        if (!selectedDate) return []
        return matchingSlots
            .filter((s) => dateKey(s.startTime) === selectedDate)
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    }, [matchingSlots, selectedDate])

    const selectedSlot = useMemo(
        () => timeSlots.find((s) => String(s.id) === String(selectedSlotId)) || null,
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
                (a) =>
                    (a.status === 'BOOKED' || a.status === 'CONFIRMED') &&
                    a.startTime &&
                    new Date(a.startTime).getTime() > Date.now()
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
        return [...mine].sort((a, b) => {
            const at = a.startTime ? new Date(a.startTime).getTime() : 0
            const bt = b.startTime ? new Date(b.startTime).getTime() : 0
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
                                        onChange={(e) => setSelectedOfficeId(e.target.value)}
                                        disabled={hasUpcoming}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">Select Office</option>
                                        {officeOptions.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.name}
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
                                        onChange={(e) => setSelectedServiceId(e.target.value)}
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
                                        {serviceOptions.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
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
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            disabled={hasUpcoming}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            <option value="">Select Date</option>
                                            {dateOptions.map((d) => (
                                                <option key={d} value={d}>
                                                    {formatDate(d)}
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
                                            onChange={(e) => setSelectedSlotId(e.target.value)}
                                            disabled={hasUpcoming}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            <option value="">Select Time</option>
                                            {timeSlots.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {formatTimeOnly(s.startTime)} — {s.remaining} left
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
                                            onChange={(e) => setNotes(e.target.value)}
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
                            {sortedMine.map((a) => {
                                const reference = generateReference(a)
                                const isUpcoming =
                                    a.status === 'BOOKED' || a.status === 'CONFIRMED'
                                const officeName = a.officeName || a.slotTitle || 'Appointment'

                                return (
                                    <motion.li
                                        key={a.id}
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

                                                {a.slotTitle && a.slotTitle !== officeName && (
                                                    <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                                                        {a.slotTitle}
                                                    </p>
                                                )}

                                                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    <span>{formatDateTime(a.startTime)}</span>
                                                </div>

                                                {a.staffName && (
                                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                        <User className="h-3 w-3 shrink-0" />
                                                        {a.staffName}
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
                                                <Badge variant={STATUS_VARIANTS[a.status] || 'default'}>
                                                    {STATUS_LABELS[a.status] || a.status}
                                                </Badge>

                                                {isUpcoming && (
                                                    <button
                                                        onClick={() => setCancelTarget(a)}
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