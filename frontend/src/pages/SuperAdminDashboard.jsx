import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2,
    Users,
    LayoutGrid,
    Ticket,
    Plus,
    Power,
    PowerOff,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import PageHeader from '../components/layout/PageHeader'
import { SkeletonStats } from '../components/ui/Skeleton'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { stagger, staggerItem, expand } from '../lib/motion'

const emptyForm = {
    name: '',
    code: '',
    emailDomain: '',
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    matricPattern: '',
    matricExample: '',
    matricDescription: '',
}

export default function SuperAdminDashboard() {
    const { user } = useAuthStore()
    const { push } = useToastStore()
    const [universities, setUniversities] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [toggling, setToggling] = useState(null)

    const load = useCallback(async () => {
        try {
            const [u, a] = await Promise.all([
                api.get('/api/super-admin/universities'),
                api.get('/api/super-admin/analytics').catch(() => ({ data: { data: null } })),
            ])
            setUniversities(u.data.data || [])
            setAnalytics(a.data.data || null)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    const createUniversity = async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
            await api.post('/api/super-admin/universities', form)
            push({ type: 'success', message: 'University registered' })
            setForm(emptyForm)
            setShowCreate(false)
            await load()
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to register university',
            })
        } finally {
            setCreating(false)
        }
    }

    const toggleActive = async (u) => {
        setToggling(u.id)
        try {
            if (u.isActive) {
                await api.post(`/api/super-admin/universities/${u.id}/deactivate`)
                push({ type: 'success', message: `${u.name} deactivated` })
            } else {
                await api.post(`/api/super-admin/universities/${u.id}/reactivate`)
                push({ type: 'success', message: `${u.name} reactivated` })
            }
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed' })
        } finally {
            setToggling(null)
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 h-12 w-1/3 animate-pulse rounded-lg bg-slate-200" />
                <SkeletonStats count={4} />
                <div className="mt-8 h-64 animate-pulse rounded-xl bg-slate-100" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                title="Platform Console"
                description={`Signed in as ${user?.fullName}`}
                action={
                    <Button
                        icon={Plus}
                        onClick={() => setShowCreate((v) => !v)}
                        variant={showCreate ? 'secondary' : 'primary'}
                    >
                        {showCreate ? 'Cancel' : 'Register university'}
                    </Button>
                }
            />

            {analytics && (
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Universities"
                        value={analytics.totalUniversities}
                        icon={Building2}
                        delay={0}
                    />
                    <StatCard
                        label="Total users"
                        value={analytics.totalUsers}
                        icon={Users}
                        delay={0.05}
                    />
                    <StatCard
                        label="Active queues"
                        value={analytics.activeQueues}
                        icon={LayoutGrid}
                        delay={0.1}
                    />
                    <StatCard
                        label="Tickets today"
                        value={analytics.ticketsToday}
                        icon={Ticket}
                        delay={0.15}
                        hint={`${analytics.ticketsAllTime ?? 0} all time`}
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
                                Register a new university
                            </h3>
                            <form
                                onSubmit={createUniversity}
                                className="grid grid-cols-1 gap-4 md:grid-cols-2"
                            >
                                <Input
                                    label="University name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="University of Lagos"
                                    required
                                />
                                <Input
                                    label="Code"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    placeholder="UNILAG"
                                    required
                                />
                                <Input
                                    label="Email domain"
                                    value={form.emailDomain}
                                    onChange={(e) => setForm({ ...form, emailDomain: e.target.value })}
                                    placeholder="@unilag.edu.ng"
                                />
                                <Input
                                    label="Matric pattern (regex)"
                                    value={form.matricPattern}
                                    onChange={(e) => setForm({ ...form, matricPattern: e.target.value })}
                                    placeholder="^\\d{2}/\\d{5}/\\d{3}$"
                                />
                                <Input
                                    label="Matric example"
                                    value={form.matricExample}
                                    onChange={(e) => setForm({ ...form, matricExample: e.target.value })}
                                    placeholder="21/12345/001"
                                />
                                <Input
                                    label="Matric description"
                                    value={form.matricDescription}
                                    onChange={(e) =>
                                        setForm({ ...form, matricDescription: e.target.value })
                                    }
                                    placeholder="YY/XXXXX/XXX"
                                />
                                <Input
                                    label="First admin name"
                                    value={form.adminFullName}
                                    onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
                                    placeholder="Jane Doe"
                                    required
                                />
                                <Input
                                    label="First admin email"
                                    type="email"
                                    value={form.adminEmail}
                                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                                    placeholder="admin@unilag.edu.ng"
                                    required
                                />
                                <Input
                                    label="First admin password"
                                    type="password"
                                    value={form.adminPassword}
                                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                                    placeholder="At least 8 characters"
                                    required
                                />
                                <div className="md:col-span-2">
                                    <Button type="submit" loading={creating} disabled={creating}>
                                        Register university
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Card padded={false}>
                <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                        Registered universities
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                Plan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <motion.tbody
                            variants={stagger(0, 0.03)}
                            initial="initial"
                            animate="animate"
                            className="divide-y divide-slate-100"
                        >
                            {universities.map((u) => (
                                <motion.tr key={u.id} variants={staggerItem}>
                                    <td className="px-6 py-3 font-mono text-sm text-slate-700">
                                        {u.code}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-900">{u.name}</td>
                                    <td className="px-6 py-3 text-sm text-slate-600">{u.plan}</td>
                                    <td className="px-6 py-3">
                                        <Badge variant={u.isActive ? 'success' : 'default'}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <motion.button
                                            whileHover={{ y: -1 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => toggleActive(u)}
                                            disabled={toggling === u.id}
                                            className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                                u.isActive
                                                    ? 'text-rose-600 hover:text-rose-700'
                                                    : 'text-emerald-600 hover:text-emerald-700'
                                            }`}
                                        >
                                            {u.isActive ? (
                                                <>
                                                    <PowerOff className="h-3.5 w-3.5" />
                                                    Deactivate
                                                </>
                                            ) : (
                                                <>
                                                    <Power className="h-3.5 w-3.5" />
                                                    Reactivate
                                                </>
                                            )}
                                        </motion.button>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}