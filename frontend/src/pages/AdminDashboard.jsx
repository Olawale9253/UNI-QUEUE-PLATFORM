import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutGrid,
    Users,
    Ticket,
    Clock,
    Plus,
    MapPin,
    UserCheck,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/layout/PageHeader'
import { SkeletonStats, SkeletonQueueGrid } from '../components/ui/Skeleton'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { stagger, staggerItem, expand } from '../lib/motion'

export default function AdminDashboard() {
    const { user } = useAuthStore()
    const { push } = useToastStore()
    const [queues, setQueues] = useState([])
    const [staff, setStaff] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({
        name: '',
        location: '',
        maxCapacity: 50,
        averageServiceMinutes: 5,
        allowWaitlist: true,
    })

    const load = useCallback(async () => {
        try {
            const [q, a, s] = await Promise.all([
                api.get('/api/admin/queues'),
                api.get('/api/admin/analytics').catch(() => ({ data: { data: null } })),
                api.get('/api/admin/staff').catch(() => ({ data: { data: [] } })),
            ])
            setQueues(q.data.data || [])
            setAnalytics(a.data.data || null)
            setStaff(s.data.data || [])
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    const createQueue = async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
            await api.post('/api/admin/queues', {
                ...form,
                maxCapacity: Number(form.maxCapacity),
                averageServiceMinutes: Number(form.averageServiceMinutes),
                opensAt: '00:00:00',
                closesAt: '23:59:59',
            })
            push({ type: 'success', message: 'Queue created' })
            setForm({ name: '', location: '', maxCapacity: 50, averageServiceMinutes: 5, allowWaitlist: true })
            setShowCreate(false)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to create queue' })
        } finally {
            setCreating(false)
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 h-12 w-1/3 animate-pulse rounded-lg bg-slate-200" />
                <SkeletonStats count={4} />
                <div className="mb-8 mt-8 h-6 w-1/4 animate-pulse rounded bg-slate-200" />
                <SkeletonQueueGrid count={3} />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                title="Administration"
                description={`Managing operations for ${user?.fullName}'s university`}
                action={
                    <Button
                        icon={Plus}
                        onClick={() => setShowCreate((v) => !v)}
                        variant={showCreate ? 'secondary' : 'primary'}
                    >
                        {showCreate ? 'Cancel' : 'New queue'}
                    </Button>
                }
            />

            {analytics && (
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total queues"
                        value={analytics.totalQueues}
                        icon={LayoutGrid}
                        delay={0}
                    />
                    <StatCard
                        label="Staff members"
                        value={analytics.totalStaff}
                        icon={Users}
                        delay={0.05}
                    />
                    <StatCard
                        label="Tickets today"
                        value={analytics.ticketsToday}
                        icon={Ticket}
                        delay={0.1}
                    />
                    <StatCard
                        label="Currently waiting"
                        value={analytics.waitingNow}
                        icon={Clock}
                        delay={0.15}
                        hint={
                            analytics.avgWaitMinutes
                                ? `Avg. wait ${analytics.avgWaitMinutes} min`
                                : undefined
                        }
                    />
                </div>
            )}

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
                                Create new queue
                            </h3>
                            <form onSubmit={createQueue} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input
                                    label="Queue name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Bursary Payments"
                                    required
                                />
                                <Input
                                    label="Location"
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    placeholder="e.g. Block A, Room 12"
                                />
                                <Input
                                    label="Capacity per day"
                                    type="number"
                                    value={form.maxCapacity}
                                    onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
                                />
                                <Input
                                    label="Average service time (min)"
                                    type="number"
                                    value={form.averageServiceMinutes}
                                    onChange={(e) =>
                                        setForm({ ...form, averageServiceMinutes: e.target.value })
                                    }
                                />
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={form.allowWaitlist}
                                            onChange={(e) =>
                                                setForm({ ...form, allowWaitlist: e.target.checked })
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Allow students to join a waitlist when the queue is full
                                    </label>
                                </div>
                                <div className="md:col-span-2">
                                    <Button type="submit" loading={creating} disabled={creating}>
                                        Create queue
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-8">
                <h2 className="mb-4 text-base font-semibold text-slate-900">Queues</h2>
                {queues.length === 0 ? (
                    <EmptyState
                        icon={LayoutGrid}
                        title="No queues yet"
                        description="Create your first queue to start serving students."
                        action={
                            <Button icon={Plus} onClick={() => setShowCreate(true)}>
                                Create queue
                            </Button>
                        }
                    />
                ) : (
                    <motion.div
                        variants={stagger(0, 0.05)}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {queues.map((q) => (
                            <motion.div
                                key={q.id}
                                variants={staggerItem}
                                whileHover={{ y: -3 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="h-full">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <h3 className="text-base font-semibold text-slate-900">
                                            {q.name}
                                        </h3>
                                        <Badge variant={q.isActive ? 'success' : 'default'}>
                                            {q.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    {q.location && (
                                        <p className="flex items-center gap-1.5 text-sm text-slate-500">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {q.location}
                                        </p>
                                    )}
                                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs">
                                        <div>
                                            <div className="text-slate-500">Capacity</div>
                                            <div className="mt-0.5 text-sm font-medium text-slate-900">
                                                {q.maxCapacity}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500">Avg. min</div>
                                            <div className="mt-0.5 text-sm font-medium text-slate-900">
                                                {q.averageServiceMinutes}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500">Staff</div>
                                            <div className="mt-0.5 text-sm font-medium text-slate-900">
                                                {q.staffCount ?? 0}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            <div>
                <h2 className="mb-4 text-base font-semibold text-slate-900">Staff members</h2>
                {staff.length === 0 ? (
                    <EmptyState
                        icon={UserCheck}
                        title="No staff members"
                        description="Add staff members to serve tickets in your queues."
                    />
                ) : (
                    <Card padded={false}>
                        <motion.ul
                            variants={stagger(0, 0.04)}
                            initial="initial"
                            animate="animate"
                            className="divide-y divide-slate-100"
                        >
                            {staff.map((s) => (
                                <motion.li
                                    key={s.id}
                                    variants={staggerItem}
                                    className="flex items-center justify-between px-6 py-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                            {s.fullName?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">
                                                {s.fullName}
                                            </div>
                                            <div className="text-xs text-slate-500">{s.email}</div>
                                        </div>
                                    </div>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Card>
                )}
            </div>
        </div>
    )
}