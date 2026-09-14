import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Calendar,
    Clock,
    MapPin,
    Users,
    X,
    GraduationCap,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import {
    CATEGORY_LABELS,
    CATEGORY_STYLES,
    CATEGORY_OPTIONS,
    formatSlotRange,
} from '../../lib/appointments'
import { stagger, staggerItem, expand } from '../../lib/motion'

const initialForm = {
    title: '',
    description: '',
    category: 'ACADEMIC_ADVISING',
    faculty: '',
    department: '',
    location: '',
    roomDetail: '',
    staffRole: '',
    durationMinutes: 30,
    whatToBring: '',
    date: '',
    startTime: '10:00',
    endTime: '10:30',
    capacity: 1,
}

export default function AppointmentSlots() {
    const { push } = useToastStore()
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [bookings, setBookings] = useState([])
    const [bookingsLoading, setBookingsLoading] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/staff/appointment-slots')
            setSlots(res.data.data || [])
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load slots' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    const loadBookings = async (slotId) => {
        setBookingsLoading(true)
        try {
            const res = await api.get(`/api/staff/appointment-slots/${slotId}/appointments`)
            setBookings(res.data.data || [])
        } catch {
            setBookings([])
        } finally {
            setBookingsLoading(false)
        }
    }

    const openSlot = (slot) => {
        setSelectedSlot(slot)
        loadBookings(slot.id)
    }

    const setField = (f) => (e) => setForm({ ...form, [f]: e.target.value })

    const submit = async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
            const startTime = `${form.date}T${form.startTime}:00`
            const endTime = `${form.date}T${form.endTime}:00`

            await api.post('/api/staff/appointment-slots', {
                title: form.title,
                description: form.description || null,
                category: form.category,
                faculty: form.faculty || null,
                department: form.department || null,
                location: form.location || null,
                roomDetail: form.roomDetail || null,
                staffRole: form.staffRole || null,
                durationMinutes: Number(form.durationMinutes),
                whatToBring: form.whatToBring || null,
                startTime,
                endTime,
                capacity: Number(form.capacity),
            })
            push({ type: 'success', message: 'Slot created' })
            setForm(initialForm)
            setShowCreate(false)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to create slot' })
        } finally {
            setCreating(false)
        }
    }

    const deleteSlot = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/staff/appointment-slots/${deleteTarget.id}`)
            push({ type: 'success', message: 'Slot deleted' })
            setDeleteTarget(null)
            if (selectedSlot?.id === deleteTarget.id) setSelectedSlot(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to delete' })
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        )
    }

    return (
        <>
            <PageHeader
                title="Appointment Slots"
                description="Offer 1-on-1 or group appointment slots for students to book."
                action={
                    <Button
                        icon={Plus}
                        onClick={() => setShowCreate((v) => !v)}
                        variant={showCreate ? 'secondary' : 'primary'}
                    >
                        {showCreate ? 'Cancel' : 'New slot'}
                    </Button>
                }
            />

            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        variants={expand}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="mb-8 overflow-hidden"
                    >
                        <Card>
                            <h3 className="mb-4 text-base font-semibold text-slate-900">
                                Create appointment slot
                            </h3>
                            <form onSubmit={submit} className="space-y-4">
                                <Input
                                    label="Title"
                                    value={form.title}
                                    onChange={setField('title')}
                                    placeholder="e.g. Final Year Project Consultation"
                                    required
                                />

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Description
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={form.description}
                                        onChange={setField('description')}
                                        placeholder="Briefly describe what this appointment is about…"
                                        className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Select
                                        label="Category"
                                        value={form.category}
                                        onChange={setField('category')}
                                        options={CATEGORY_OPTIONS}
                                        required
                                    />
                                    <Input
                                        label="Your role / title"
                                        value={form.staffRole}
                                        onChange={setField('staffRole')}
                                        placeholder="e.g. Senior Advisor"
                                    />
                                    <Input
                                        label="Faculty"
                                        value={form.faculty}
                                        onChange={setField('faculty')}
                                        placeholder="e.g. Faculty of Science"
                                        icon={GraduationCap}
                                    />
                                    <Input
                                        label="Department"
                                        value={form.department}
                                        onChange={setField('department')}
                                        placeholder="e.g. Computer Science"
                                    />
                                    <Input
                                        label="Location"
                                        value={form.location}
                                        onChange={setField('location')}
                                        placeholder="e.g. CS Building"
                                        icon={MapPin}
                                    />
                                    <Input
                                        label="Room detail"
                                        value={form.roomDetail}
                                        onChange={setField('roomDetail')}
                                        placeholder="e.g. Room 201, First Floor"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        What to bring
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={form.whatToBring}
                                        onChange={setField('whatToBring')}
                                        placeholder="e.g. Student ID, payment receipt, laptop"
                                        className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <Input
                                        label="Date"
                                        type="date"
                                        value={form.date}
                                        onChange={setField('date')}
                                        required
                                    />
                                    <Input
                                        label="Start time"
                                        type="time"
                                        value={form.startTime}
                                        onChange={setField('startTime')}
                                        required
                                    />
                                    <Input
                                        label="End time"
                                        type="time"
                                        value={form.endTime}
                                        onChange={setField('endTime')}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Duration (minutes)"
                                        type="number"
                                        min="5"
                                        max="240"
                                        value={form.durationMinutes}
                                        onChange={setField('durationMinutes')}
                                    />
                                    <Input
                                        label="Capacity (1 = 1-on-1, >1 = group)"
                                        type="number"
                                        min="1"
                                        max="200"
                                        value={form.capacity}
                                        onChange={setField('capacity')}
                                        hint="Set to 1 for individual meetings."
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setForm(initialForm)
                                            setShowCreate(false)
                                        }}
                                        disabled={creating}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={creating} disabled={creating}>
                                        Create slot
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {slots.length === 0 ? (
                <EmptyState
                    icon={Calendar}
                    title="No slots yet"
                    description="Create your first appointment slot so students can book time with you."
                    action={
                        <Button icon={Plus} onClick={() => setShowCreate(true)}>
                            Create slot
                        </Button>
                    }
                />
            ) : (
                <motion.div
                    variants={stagger(0, 0.05)}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 gap-4 lg:grid-cols-3"
                >
                    {slots.map((slot) => (
                        <motion.div key={slot.id} variants={staggerItem}>
                            <SlotCard
                                slot={slot}
                                onClick={() => openSlot(slot)}
                                onDelete={() => setDeleteTarget(slot)}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <AnimatePresence>
                {selectedSlot && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => setSelectedSlot(null)}
                            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl"
                        >
                            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                                <div className="min-w-0">
                                    <h3 className="truncate text-base font-semibold text-slate-900">
                                        {selectedSlot.title}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {formatSlotRange(selectedSlot.startTime, selectedSlot.endTime).date}
                                        {' · '}
                                        {formatSlotRange(selectedSlot.startTime, selectedSlot.endTime).startTime}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedSlot(null)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    Bookings (
                      {bookings.filter((b) => b.status === 'BOOKED').length} /{' '}
                      {selectedSlot.capacity})
                  </span>
                                    <Badge variant={selectedSlot.remaining > 0 ? 'success' : 'default'}>
                                        {selectedSlot.remaining} remaining
                                    </Badge>
                                </div>

                                {bookingsLoading ? (
                                    <div className="text-sm text-slate-500">Loading…</div>
                                ) : bookings.length === 0 ? (
                                    <EmptyState
                                        icon={Users}
                                        title="No bookings yet"
                                        description="Students will appear here once they book."
                                    />
                                ) : (
                                    <ul className="space-y-2">
                                        {bookings.map((b) => (
                                            <li
                                                key={b.id}
                                                className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-slate-900">
                                                            {b.studentName}
                                                        </div>
                                                        <div className="mt-0.5 text-xs text-slate-500">
                                                            {b.studentEmail}
                                                            {b.matricNumber ? ` · ${b.matricNumber}` : ''}
                                                        </div>
                                                        {b.notes && (
                                                            <p className="mt-2 rounded bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                                                                "{b.notes}"
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge variant={b.status === 'BOOKED' ? 'indigo' : 'default'}>
                                                        {b.status}
                                                    </Badge>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={deleteSlot}
                title={`Delete "${deleteTarget?.title}"?`}
                description="This slot will be permanently removed. Slots with active bookings cannot be deleted."
                confirmLabel="Delete slot"
                variant="danger"
                loading={deleting}
            />
        </>
    )
}

function SlotCard({ slot, onClick, onDelete }) {
    const { date, startTime, endTime } = formatSlotRange(slot.startTime, slot.endTime)
    const categoryLabel = CATEGORY_LABELS[slot.category] || 'Other'
    const categoryStyle = CATEGORY_STYLES[slot.category] || CATEGORY_STYLES.OTHER

    return (
        <div className="relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex items-start justify-between gap-2">
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyle}`}
        >
          {categoryLabel}
        </span>
                <Badge variant={slot.bookedCount > 0 ? 'success' : 'default'}>
                    {slot.bookedCount}/{slot.capacity}
                </Badge>
            </div>

            <h3 className="text-base font-semibold text-slate-900">{slot.title}</h3>

            <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {date}
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {startTime} – {endTime}
                </div>
                {slot.location && (
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {slot.roomDetail || slot.location}
                    </div>
                )}
            </div>

            <div className="mt-auto flex items-center gap-2 pt-5">
                <Button size="sm" variant="subtle" onClick={onClick} fullWidth icon={Users}>
                    View bookings
                </Button>
                <button
                    onClick={onDelete}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete slot"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}