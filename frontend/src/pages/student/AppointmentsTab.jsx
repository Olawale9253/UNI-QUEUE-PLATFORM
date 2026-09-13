import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, User, X, BookOpen } from 'lucide-react'
import api from '../../api/axios.js'
import Card from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { SkeletonQueueGrid, SkeletonRow } from '../../components/ui/Skeleton.jsx'
import { useToastStore } from '../../store/toastStore.js'
import { formatDateTime } from '../../lib/format.js'
import { stagger, staggerItem } from '../../lib/motion.js'

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
    const [booking, setBooking] = useState(null)
    const [cancelling, setCancelling] = useState(null)

    const load = useCallback(async () => {
        try {
            const [a, m] = await Promise.all([
                api.get('/api/user/appointments/available'),
                api.get('/api/user/appointments'),
            ])
            setAvailable(a.data.data || [])
            setMine(m.data.data || [])
        } catch {
            // ignore
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const book = async (slotId) => {
        setBooking(slotId)
        try {
            await api.post('/api/user/appointments/book', { slotId })
            push({ type: 'success', message: 'Appointment booked' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to book' })
        } finally {
            setBooking(null)
        }
    }

    const cancel = async (id) => {
        setCancelling(id)
        try {
            await api.post(`/api/user/appointments/${id}/cancel`)
            push({ type: 'success', message: 'Appointment cancelled' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to cancel' })
        } finally {
            setCancelling(null)
        }
    }

    const upcomingMine = mine.filter((a) => a.status === 'BOOKED')
    const pastMine = mine.filter((a) => a.status !== 'BOOKED')

    return (
        <div className="space-y-10">
            <section>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                        Available appointments
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Book a 1-on-1 slot with an advisor, counsellor, or staff member.
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
                            <motion.div key={slot.id} variants={staggerItem}>
                                <Card className="flex h-full flex-col">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-base font-semibold text-slate-900">
                                            {slot.title}
                                        </h3>
                                        <Badge variant={slot.remaining > 0 ? 'success' : 'default'}>
                                            {slot.remaining} left
                                        </Badge>
                                    </div>

                                    {slot.description && (
                                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                                            {slot.description}
                                        </p>
                                    )}

                                    <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatDateTime(slot.startTime)}
                                        </div>
                                        {slot.location && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {slot.location}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" />
                                            {slot.staffName}
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <Button
                                            fullWidth
                                            onClick={() => book(slot.id)}
                                            disabled={slot.remaining <= 0 || booking === slot.id}
                                            loading={booking === slot.id}
                                        >
                                            {slot.remaining <= 0 ? 'Full' : 'Book slot'}
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </section>

            {upcomingMine.length > 0 && (
                <section>
                    <h2 className="mb-4 text-base font-semibold text-slate-900">
                        My upcoming appointments
                    </h2>
                    <Card padded={false}>
                        <ul className="divide-y divide-slate-100">
                            {upcomingMine.map((a) => (
                                <li key={a.id} className="flex items-center justify-between px-6 py-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {a.slotTitle}
                      </span>
                                            <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                          {formatDateTime(a.startTime)}
                      </span>
                                            <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                                                {a.staffName}
                      </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={X}
                                        onClick={() => cancel(a.id)}
                                        disabled={cancelling === a.id}
                                        loading={cancelling === a.id}
                                    >
                                        Cancel
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </section>
            )}

            {pastMine.length > 0 && (
                <section>
                    <h2 className="mb-4 text-base font-semibold text-slate-900">Past</h2>
                    <Card padded={false}>
                        <ul className="divide-y divide-slate-100">
                            {pastMine.slice(0, 10).map((a) => (
                                <li key={a.id} className="flex items-center justify-between px-6 py-3">
                                    <div>
                                        <span className="text-sm text-slate-700">{a.slotTitle}</span>
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
        </div>
    )
}