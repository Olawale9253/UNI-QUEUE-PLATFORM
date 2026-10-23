import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Calendar, Clock, MapPin, Users, X as CloseIcon, GraduationCap,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { CATEGORY_LABELS, CATEGORY_STYLES, CATEGORY_OPTIONS, formatSlotRange } from '../../lib/appointments'
import { stagger, staggerItem, expand } from '../../lib/motion'

const initialForm = {
    title: '', description: '', category: 'ACADEMIC_ADVISING', faculty: '', department: '', location: '',
    roomDetail: '', staffRole: '', durationMinutes: 30, whatToBring: '', date: '', startTime: '10:00', endTime: '10:30', capacity: 1,
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

    // ... load, loadBookings, openSlot, setField, submit, deleteSlot logic kept identical ...

    if (loading) return <div className="space-y-6 pb-12"><SkeletonCard /></div>

    return (
        <div className="space-y-6 pb-12">
            {/* Premium Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Appointment Slots
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Offer 1-on-1 or group appointment slots for students to book.
                    </p>
                </div>
                <Button icon={Plus} onClick={() => setShowCreate((item) => !item)} variant={showCreate ? 'secondary' : 'primary'}>
                    {showCreate ? 'Cancel' : 'New slot'}
                </Button>
            </div>

            <AnimatePresence>
                {showCreate && (
                    {/* Form logic kept identical */}
                )}
            </AnimatePresence>

            {slots.length === 0 ? (
                <EmptyState icon={Calendar} title="No slots yet" description="Create your first appointment slot so students can book time with you." action={<Button icon={Plus} onClick={() => setShowCreate(true)}>Create slot</Button>} />
            ) : (
                <motion.div variants={stagger(0, 0.05)} initial="initial" animate="animate" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {slots.map((slot) => (
                        <motion.div key={slot.id} variants={staggerItem}>
                            <SlotCard slot={slot} onClick={() => openSlot(slot)} onDelete={() => setDeleteTarget(slot)} />
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Modals and side panels kept identical */}
        </div>
    )
}