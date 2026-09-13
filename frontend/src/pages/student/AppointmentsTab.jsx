import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar,
    Clock,
    MapPin,
    User,
    X,
    BookOpen,
    Building2,
    GraduationCap,
    Users,
    FileText,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../lib/format'
import {
    CATEGORY_LABELS,
    CATEGORY_STYLES,
    formatSlotRange,
} from '../../lib/appointments'
import { stagger, staggerItem, expand } from '../../lib/motion'

const statusVariant = {
    BOOKED: 'indigo',
    CANCELLED: 'default',
    COMPLETED: 'success',
    NO_SHOW: 'danger',
}

export default function AppointmentsTab() {
    const { push } = useToastStore()
    const [available, setAvailable] = useState([])
    const [mine, setMine] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedSlot, setSelectedSlot] = useState(null) // for detail modal
    const [bookingNotes, setBookingNotes] = useState('')
    const [booking, setBooking] = useState(false)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [cancelling, setCancelling] = useState(false)

    const load = useCallback(async () => {
        try {
            const [a, m] = await Promise.all([
                api.get('/api/user/appointments/available'),
                api.get('/api/user/appointments'),
            ])
            setAvailable(a.data.data || [])
            setMine(m.data.data || [])
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const openSlot = (slot) => {
        setSelectedSlot(slot)
        setBookingNotes('')
    }

    const closeSlot = () => {
        if (booking) return
        setSelectedSlot(null)
        setBookingNotes('')
    }

    const confirmBooking = async () => {
        if (!selectedSlot) return
        setBooking(true)
        try {
            await api.post('/api/user/appointments/book', {
                slotId: selectedSlot.id,
                notes: bookingNotes.trim() || null,
            })
            push({ type: 'success', message: `Booked: ${selectedSlot.title}` })
            setSelectedSlot(null)
            setBookingNotes('')
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

    const upcomingMine = mine.filter((a) => a.status === 'BOOKED')
    const pastMine = mine.filter((a) => a.status !== 'BOOKED')

    return (
        <div className="space-y-10">
            {/* Available slots */}
            <section>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                        Available appointments
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Book a 1-on-1 slot with an advisor, counsellor, or staff member.
                        Click a slot to see full details before booking.
                    </p>
                </div>

                {loading ? (
                    <SkeletonQueueGrid count={3} />
                ) : available.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title="No appointment slots available"
                        description="Check back later — staff publish new slots regularly."
                    />
                ) : (
                    <motion.div
                        variants={stagger(0, 0.05)}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {available.map((slot) => (
                            <SlotCard key={slot.id} slot={slot} onClick={() => openSlot(slot)} />
                        ))}
                    </motion.div>
                )}
            </section>

            {/* Upcoming appointments */}
            {upcomingMine.length > 0 && (
                <section>
                    <h2 className="mb-4 text-base font-semibold text-slate-900">
                        Your upcoming appointments
                    </h2>
                    <div className="space-y-3">
                        {upcomingMine.map((a) => (
                            <AppointmentRow
                                key={a.id}
                                appt={a}
                                onCancel={() => setCancelTarget(a)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Past appointments */}
            {pastMine.length > 0 && (
                <section>
                    <h2 className="mb-4 text-base font-semibold text-slate-900">
                        Past appointments
                    </h2>
                    <Card padded={false}>
                        <ul className="divide-y divide-slate-100">
                            {pastMine.slice(0, 10).map((a) => (
                                <li
                                    key={a.id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6"
                                >
                                    <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-900">
                      {a.slotTitle}
                    </span>
                                        <span className="ml-2 text-xs text-slate-500">
                      · {formatDateTime(a.startTime)}
                    </span>
                                    </div>
                                    <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </section>
            )}

            {/* Booking detail modal */}
            <SlotDetailModal
                slot={selectedSlot}
                open={!!selectedSlot}
                onClose={closeSlot}
                onConfirm={confirmBooking}
                notes={bookingNotes}
                setNotes={setBookingNotes}
                loading={booking}
            />

            {/* Cancel confirmation */}
            <ConfirmDialog
                open={!!cancelTarget}
                onClose={() => !cancelling && setCancelTarget(null)}
                onConfirm={cancel}
                title={`Cancel ${cancelTarget?.slotTitle}?`}
                description={`This frees your slot for other students. You can rebook anytime if there's availability.`}
                confirmLabel="Cancel appointment"
                cancelLabel="Keep it"
                variant="danger"
                loading={cancelling}
            />
        </div>
    )
}

/* ─────────────── Slot Card ─────────────── */

function SlotCard({ slot, onClick }) {
    const { date, startTime, endTime } = formatSlotRange(slot.startTime, slot.endTime)
    const categoryLabel = CATEGORY_LABELS[slot.category] || 'Other'
    const categoryStyle = CATEGORY_STYLES[slot.category] || CATEGORY_STYLES.OTHER
    const isFull = slot.remaining <= 0

    return (
        <motion.div
            variants={staggerItem}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
        >
            <button
                onClick={onClick}
                disabled={isFull}
                className={`group flex h-full w-full flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition-all ${
                    isFull
                        ? 'cursor-not-allowed border-slate-200 opacity-60'
                        : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
            >
                {/* Category + capacity */}
                <div className="mb-3 flex items-start justify-between gap-3">
          <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyle}`}
          >
            {categoryLabel}
          </span>
                    <Badge variant={slot.remaining > 0 ? 'success' : 'default'}>
                        {slot.remaining > 0 ? `${slot.remaining} left` : 'Full'}
                    </Badge>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-700">
                    {slot.title}
                </h3>

                {/* Faculty / Dept */}
                {(slot.faculty || slot.department) && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {[slot.faculty, slot.department].filter(Boolean).join(' · ')}
                    </p>
                )}

                {slot.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                        {slot.description}
                    </p>
                )}

                {/* Key info */}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-medium text-slate-700">{date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
              {startTime} – {endTime}
                            {slot.durationMinutes ? ` · ${slot.durationMinutes} min` : ''}
            </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
              {slot.staffName}
                            {slot.staffRole ? ` · ${slot.staffRole}` : ''}
            </span>
                    </div>
                    {slot.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                {slot.roomDetail || slot.location}
              </span>
                        </div>
                    )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="font-medium text-indigo-600 group-hover:underline">
            View details & book →
          </span>
                </div>
            </button>
        </motion.div>
    )
}

/* ─────────────── Slot Detail Modal ─────────────── */

function SlotDetailModal({ slot, open, onClose, onConfirm, notes, setNotes, loading }) {
    const [confirmOpen, setConfirmOpen] = useState(false)

    if (!slot) return null

    const { date, startTime, endTime } = formatSlotRange(slot.startTime, slot.endTime)
    const categoryLabel = CATEGORY_LABELS[slot.category] || 'Other'
    const categoryStyle = CATEGORY_STYLES[slot.category] || CATEGORY_STYLES.OTHER

    const handleBookClick = () => setConfirmOpen(true)

    const handleConfirmBook = async () => {
        await onConfirm()
        setConfirmOpen(false)
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:max-h-[90vh] sm:rounded-2xl"
                        >
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${categoryStyle}`}
                            >
                {categoryLabel}
              </span>

                            <h2 className="mt-3 pr-8 text-xl font-semibold tracking-tight text-slate-900">
                                {slot.title}
                            </h2>

                            {slot.description && (
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                    {slot.description}
                                </p>
                            )}

                            {/* Detail grid */}
                            <div className="mt-6 space-y-4">
                                <DetailRow icon={Calendar} label="Date" value={date} />
                                <DetailRow
                                    icon={Clock}
                                    label="Time"
                                    value={`${startTime} – ${endTime}${
                                        slot.durationMinutes ? ` · ${slot.durationMinutes} minutes` : ''
                                    }`}
                                />
                                <DetailRow
                                    icon={User}
                                    label="Hosted by"
                                    value={[slot.staffName, slot.staffRole].filter(Boolean).join(' · ')}
                                />
                                {(slot.faculty || slot.department) && (
                                    <DetailRow
                                        icon={GraduationCap}
                                        label="Faculty / Department"
                                        value={[slot.faculty, slot.department].filter(Boolean).join(' · ')}
                                    />
                                )}
                                {slot.location && (
                                    <DetailRow
                                        icon={MapPin}
                                        label="Location"
                                        value={slot.roomDetail ? `${slot.location} · ${slot.roomDetail}` : slot.location}
                                    />
                                )}
                                <DetailRow
                                    icon={Users}
                                    label="Capacity"
                                    value={`${slot.bookedCount} of ${slot.capacity} booked · ${slot.remaining} remaining`}
                                />
                                {slot.whatToBring && (
                                    <DetailRow
                                        icon={FileText}
                                        label="What to bring"
                                        value={slot.whatToBring}
                                        multiline
                                    />
                                )}
                            </div>

                            {/* Notes */}
                            <div className="mt-6">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    What would you like to discuss?{' '}
                                    <span className="text-xs font-normal text-slate-500">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. I'd like to review my final year project methodology."
                                    className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Your host will see this before the appointment.
                                </p>
                            </div>

                            {/* Info banner */}
                            <div className="mt-6 flex items-start gap-2 rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>
                  Please arrive 5 minutes early. You'll receive a reminder notification
                  before your appointment.
                </span>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button variant="secondary" onClick={onClose} disabled={loading}>
                                    Close
                                </Button>
                                <Button onClick={handleBookClick} disabled={loading || slot.remaining <= 0}>
                                    {slot.remaining <= 0 ? 'Slot full' : 'Book this slot'}
                                </Button>
                            </div>

                            {/* Nested confirm */}
                            <ConfirmDialog
                                open={confirmOpen}
                                onClose={() => !loading && setConfirmOpen(false)}
                                onConfirm={handleConfirmBook}
                                title={`Confirm booking?`}
                                description={`${slot.title} · ${date} · ${startTime}. A slot will be reserved for you.`}
                                confirmLabel="Yes, book it"
                                cancelLabel="Not yet"
                                variant="info"
                                loading={loading}
                            />
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}

function DetailRow({ icon: Icon, label, value, multiline }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Icon className="h-4 w-4 text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    {label}
                </div>
                <div
                    className={`text-sm font-medium text-slate-900 ${
                        multiline ? 'whitespace-pre-wrap' : 'truncate'
                    }`}
                >
                    {value || '—'}
                </div>
            </div>
        </div>
    )
}

/* ─────────────── Upcoming Appointment Row ─────────────── */

function AppointmentRow({ appt, onCancel }) {
    const { date, startTime, endTime } = formatSlotRange(appt.startTime, appt.endTime)
    const categoryLabel = CATEGORY_LABELS[appt.category] || 'Other'
    const categoryStyle = CATEGORY_STYLES[appt.category] || CATEGORY_STYLES.OTHER

    return (
        <motion.div variants={staggerItem}>
            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyle}`}
              >
                {categoryLabel}
              </span>
                            <Badge variant={statusVariant[appt.status]}>{appt.status}</Badge>
                        </div>

                        <h3 className="text-base font-semibold text-slate-900">
                            {appt.slotTitle}
                        </h3>

                        <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-slate-600 sm:grid-cols-2">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                {date}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                {startTime} – {endTime}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                {appt.staffName}
                            </div>
                            {appt.slotLocation && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    {appt.slotLocation}
                                </div>
                            )}
                        </div>

                        {appt.notes && (
                            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                <span className="font-medium text-slate-700">Your note: </span>
                                {appt.notes}
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        icon={X}
                        onClick={onCancel}
                        className="self-start text-rose-600 hover:bg-rose-50"
                    >
                        Cancel
                    </Button>
                </div>
            </Card>
        </motion.div>
    )
}