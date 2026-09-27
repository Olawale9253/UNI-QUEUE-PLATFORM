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
    Building2,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonStats, SkeletonQueueGrid } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { groupQueuesByOffice } from '../../lib/groupQueues'
import { stagger, staggerItem, expand } from '../../lib/motion'

export default function Overview() {
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
        department: '',
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
                department: form.department?.trim() || null,
                maxCapacity: Number(form.maxCapacity),
                averageServiceMinutes: Number(form.averageServiceMinutes),
                opensAt: '00:00:00',
                closesAt: '23:59:59',
            })
            push({ type: 'success', message: 'Queue created' })
            setForm({
                name: '',
                department: '',
                location: '',
                maxCapacity: 50,
                averageServiceMinutes: 5,
                allowWaitlist: true,
            })
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
            <>
                <div className="mb-6 h-10 w-1/3 animate-pulse rounded-lg bg-slate-200" />
                <SkeletonStats count={4} />
                <div className="mb-8 mt-8 h-6 w-1/4 animate-pulse rounded bg-slate-200" />
                <SkeletonQueueGrid count={3} />
            </>
        )
    }

    const groups = groupQueuesByOffice(queues)

    const QueueCard = ({ q }) => (
        <motion.div variants={staggerItem}>
            <Card className="h-full">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900">{q.name}</h3>
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
    )

    return (
        <>
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
                                    placeholder="e.g. Fee Payments"
                                    required
                                />
                                <Input
                                    label="Location"
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    placeholder="e.g. Block A, Room 12"
                                />
                                <Input
                                    label="Department"
                                    value={form.department}
                                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                                    placeholder="e.g. Bursary"
                                    icon={Building2}
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
                                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
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

            <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-900">Queues</h2>
            </div>

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
                <div className="space-y-8">
                    {groups.map((group, groupIdx) => (
                        <motion.section
                            key={group.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: groupIdx * 0.05 }}
                        >
                            {/* Department header */}
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-brand-600" />
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                                        {group.label}
                                    </h4>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {group.queues.length}{' '}
                                        {group.queues.length === 1 ? 'queue' : 'queues'}
                  </span>
                                </div>
                                {group.waitingTotal > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Users className="h-3 w-3" />
                                        {group.waitingTotal} waiting
                  </span>
                                )}
                            </div>

                            <motion.div
                                variants={stagger(0, 0.05)}
                                initial="initial"
                                animate="animate"
                                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                            >
                                {group.queues.map((q) => (
                                    <QueueCard key={q.id} q={q} />
                                ))}
                            </motion.div>
                        </motion.section>
                    ))}
                </div>
            )}

            {/* Staff list */}
            <div className="mt-10">
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
        </>
    )
}