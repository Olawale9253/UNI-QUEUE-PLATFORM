import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Calendar, Clock, Building2, MapPin, User, X, CheckCircle2,
    AlertCircle, Copy, Check, Filter, FileText, Search,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

// ─── Status configuration ───
const STATUS_VARIANTS = {
    BOOKED: 'indigo',
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

const SORT_OPTIONS = [
    { value: 'soonest', label: 'Soonest' },
    { value: 'latest', label: 'Latest' },
    { value: 'status', label: 'By status' },
]

// ─── Helpers ───
function formatDateTime(dt) {
    if (!dt) return '—'
    try {
        return new Date(dt).toLocaleString('en-GB', {
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

function formatDateLabel(isoDate) {
    if (!isoDate) return ''
    try {
        return new Date(isoDate).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return isoDate
    }
}

function formatTimeLabel(dt) {
    if (!dt) return ''
    try {
        return new Date(dt).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
    } catch {
        return ''
    }
}

/**
 * Client-side generated reference.
 * Format: APP{YYYY}{MM}{DD}{id padded to 4}
 * Example: APP202609110042
 */
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
    const [available, setAvailable] = useState([])
    const [mine, setMine] = useState([])
    const [loading, setLoading] = useState(true)
    const [booking, setBooking] = useState(false)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [cancelling, setCancelling] = useState(false)

    // Form state
    const [selectedOffice, setSelectedOffice] = useState('')
    const [selectedService, setSelectedService] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedSlotId, setSelectedSlotId] = useState('')
    const [notes, setNotes] = useState('')

    // List state
    const [sortBy, setSortBy] = useState('soonest')

    const load = useCallback(async () => {
        try {
            const [a, m] = await Promise.all([
                api.get('/api/user/appointments/available').catch(() => ({ data: { data: [] } })),
                api.get('/api/user/appointments').catch(() => ({ data: { data: [] } })),
            ])
            setAvailable(a.data?.data || [])
            setMine(m.data?.data || [])
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 10000, slowMs: 30000 })

    // ─── Derive dropdown options from available slots ───
    const officeOptions = useMemo(() => {
        const set = new Set()
        available.forEach((s) => {
            const o = (s.department || s.faculty || '').trim()
            if (o) set.add(o)
        })
        return Array.from(set).sort()
    }, [available])

    const serviceOptions = useMemo(() => {
        if (!selectedOffice) return []
        const set = new Set()
        available.forEach((s) => {
            const o = (s.department || s.faculty || '').trim()
            if (o === selectedOffice) set.add(s.title)
        })
        return Array.from(set).sort()
    }, [available, selectedOffice])

    const matchingSlots = useMemo(() => {
        return available.filter((s) => {
            const o = (s.department || s.faculty || '').trim()
            return (
                o === selectedOffice &&
                s.title === selectedService &&
                (s.remaining ?? 0) > 0
            )
        })
    }, [available, selectedOffice, selectedService])

    const dateOptions = useMemo(() => {
        const set = new Set()
        matchingSlots.forEach((s) => {
            if (s.startTime) set.add(s.startTime.slice(0, 10))
        })
        return Array.from(set).sort()
    }, [matchingSlots])

    const timeSlots = useMemo(() => {
        if (!selectedDate) return []
        return matchingSlots
            .filter((s) => s.startTime?.startsWith(selectedDate))
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    }, [matchingSlots, selectedDate])

    // Reset downstream fields when upstream changes
    useEffect(() => {
        setSelectedService('')
        setSelectedDate('')
        setSelectedSlotId('')
    }, [selectedOffice])

    useEffect(() => {
        setSelectedDate('')
        setSelectedSlotId('')
    }, [selectedService])

    useEffect(() => {
        setSelectedSlotId('')
    }, [selectedDate])

    const selectedSlot = useMemo(
        () => available.find((s) => String(s.id) === String(selectedSlotId)) || null,
        [available, selectedSlotId]
    )

    // ─── Actions ───
    const book = async () => {
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

            // Reset form
            setSelectedOffice('')
            setSelectedService('')
            setSelectedDate('')
            setSelectedSlotId('')
            setNotes('')

            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to book' })
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
            push({ type: 'error', message: err.response?.data?.message || 'Failed to cancel' })
        } finally {
            setCancelling(false)
        }
    }

    // ─── Sorted list ───
    const sortedAppointments = useMemo(() => {
        const list = [...mine]
        if (sortBy === 'soonest') {
            return list.sort((a, b) => {
                const at = a.startTime ? new Date(a.startTime).getTime() : 0
                const bt = b.startTime ? new Date(b.startTime).getTime() : 0
                return at - bt
            })
        }
        if (sortBy === 'latest') {
            return list.sort((a, b) => {
                const at = a.startTime ? new Date(a.startTime).getTime() : 0
                const bt = b.startTime ? new Date(b.startTime).getTime() : 0
                return bt - at
            })
        }
        if (sortBy === 'status') {
            const order = { BOOKED: 0, CONFIRMED: 1, COMPLETED: 2, NO_SHOW: 3, CANCELLED: 4 }
            return list.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
        }
        return list
    }, [mine, sortBy])

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

                        {available.length === 0 ? (
                            <EmptyState
                                icon={Calendar}
                                title="No slots available"
                                description="Check back later — staff publish new slots regularly."
                            />
                        ) : (
                            <div className="space-y-3">
                                {/* Office */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Office
                                    </label>
                                    <select
                                        value={selectedOffice}
                                        onChange={(e) => setSelectedOffice(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">Select Office</option>
                                        {officeOptions.map((o) => (
                                            <option key={o} value={o}>
                                                {o}
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
                                        value={selectedService}
                                        onChange={(e) => setSelectedService(e.target.value)}
                                        disabled={!selectedOffice}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">Select Service</option>
                                        {serviceOptions.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        min={dateOptions[0] || undefined}
                                        max={dateOptions[dateOptions.length - 1] || undefined}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        disabled={!selectedService}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                    {selectedService && dateOptions.length > 0 && (
                                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                            Available dates: {dateOptions.length}
                                        </p>
                                    )}
                                </div>

                                {/* Time */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                        Time
                                    </label>
                                    <select
                                        value={selectedSlotId}
                                        onChange={(e) => setSelectedSlotId(e.target.value)}
                                        disabled={!selectedDate || timeSlots.length === 0}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">
                                            {!selectedDate
                                                ? 'Pick a date first'
                                                : timeSlots.length === 0
                                                    ? 'No slots on this date'
                                                    : 'Select Time'}
                                        </option>
                                        {timeSlots.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {formatTimeLabel(s.startTime)} — {s.remaining} left
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Selected slot preview */}
                                {selectedSlot && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/50"
                                    >
                                        <div className="text-slate-700 dark:text-slate-300">
                                            <span className="font-semibold">{selectedSlot.title}</span>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                          {formatTimeLabel(selectedSlot.startTime)} –{' '}
                          {formatTimeLabel(selectedSlot.endTime)}
                      </span>
                                            {selectedSlot.location && (
                                                <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                                                    {selectedSlot.location}
                        </span>
                                            )}
                                        </div>
                                        {selectedSlot.staffName && (
                                            <div className="mt-1 flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                <User className="h-3 w-3" />
                                                {selectedSlot.staffName}
                                            </div>
                                        )}
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

                                {/* Book button */}
                                <Button
                                    onClick={book}
                                    loading={booking}
                                    disabled={booking || !selectedSlot}
                                    fullWidth
                                    className="!mt-4"
                                >
                                    {booking ? 'Booking…' : 'Book Appointment'}
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>

                {/* ═══ RIGHT: My Appointments ═══ */}
                <Card>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            My Appointments
                        </h3>
                        <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Sort by
              </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                {SORT_OPTIONS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {sortedAppointments.length === 0 ? (
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
                            {sortedAppointments.map((a) => {
                                const officeName = a.officeName || a.slotTitle || 'Appointment'
                                const serviceName = a.slotTitle || a.slotLocation || '—'
                                const reference = generateReference(a)
                                const isBooked = a.status === 'BOOKED' || a.status === 'CONFIRMED'

                                return (
                                    <motion.li
                                        key={a.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`rounded-lg border p-4 transition-colors ${
                                            isBooked
                                                ? 'border-brand-200 bg-gradient-to-br from-brand-50/40 to-white dark:border-brand-900 dark:from-brand-950/20 dark:to-slate-900'
                                                : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                {/* Office name (bold) */}
                                                <h4 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    {officeName}
                                                </h4>

                                                {/* Service name */}
                                                {serviceName && serviceName !== officeName && (
                                                    <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                                                        {serviceName}
                                                    </p>
                                                )}

                                                {/* Date/time */}
                                                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    <span>{formatDateTime(a.startTime)}</span>
                                                </div>

                                                {/* Reference */}
                                                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Reference:
                          </span>
                                                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {reference}
                          </span>
                                                    <CopyButton text={reference} />
                                                </div>

                                                {/* Cancelled info */}
                                                {a.status === 'CANCELLED' && a.cancelledAt && (
                                                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                        Cancelled {formatDateTime(a.cancelledAt)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex shrink-0 flex-col items-end gap-2">
                                                <Badge variant={STATUS_VARIANTS[a.status] || 'default'}>
                                                    {STATUS_LABELS[a.status] || a.status}
                                                </Badge>

                                                {isBooked && (
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
                title={`Cancel this appointment?`}
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