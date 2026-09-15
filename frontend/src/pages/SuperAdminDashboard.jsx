import { useEffect, useState, useCallback } from 'react'
import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2,
    Users,
    BarChart3,
    Plus,
    Power,
    PowerOff,
    History,
    UserPlus,
    X,
    Layers,
    Megaphone,
    Eye,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/layout/PageHeader'
import { SkeletonStats } from '../components/ui/Skeleton'
import { useToastStore } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import { useUniversityStore } from '../store/universityStore'
import { startImpersonation, clearImpersonation } from '../components/layout/ImpersonationBanner'
import { stagger, staggerItem, expand } from '../lib/motion'
import AuditLogs from './super-admin/AuditLogs'
import SystemAnalytics from './super-admin/SystemAnalytics'
import UsersPage from './super-admin/Users'
import TiersAndFeatures from './super-admin/TiersAndFeatures'
import Broadcast from './super-admin/Broadcast'

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

const emptyAdminForm = {
    fullName: '',
    email: '',
    password: '',
    department: '',
    phone: '',
}

const tabs = [
    { to: '/super-admin', label: 'Universities', icon: Building2, end: true },
    { to: '/super-admin/tiers', label: 'Tiers & Features', icon: Layers },
    { to: '/super-admin/broadcast', label: 'Broadcast', icon: Megaphone },
    { to: '/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/super-admin/users', label: 'All Users', icon: Users },
    { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: History },
]

function UniversitiesTab() {
    const { push } = useToastStore()
    const { user, token, setAuth } = useAuthStore()
    const { refresh: refreshUniversity } = useUniversityStore()
    const navigate = useNavigate()

    const [universities, setUniversities] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [toggling, setToggling] = useState(null)
    const [confirmTarget, setConfirmTarget] = useState(null)
    const [addAdminTarget, setAddAdminTarget] = useState(null)
    const [adminForm, setAdminForm] = useState(emptyAdminForm)
    const [addingAdmin, setAddingAdmin] = useState(false)
    const [impersonating, setImpersonating] = useState(null)

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
            push({ type: 'error', message: err.response?.data?.message || 'Failed to register university' })
        } finally {
            setCreating(false)
        }
    }

    const handleToggle = (u) => {
        if (u.isActive) setConfirmTarget(u)
        else performToggle(u)
    }

    const performToggle = async (u) => {
        setToggling(u.id)
        try {
            if (u.isActive) {
                await api.post(`/api/super-admin/universities/${u.id}/deactivate`)
                push({ type: 'success', message: `${u.name} deactivated` })
            } else {
                await api.post(`/api/super-admin/universities/${u.id}/reactivate`)
                push({ type: 'success', message: `${u.name} reactivated` })
            }
            setConfirmTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed' })
        } finally {
            setToggling(null)
        }
    }

    const submitNewAdmin = async (e) => {
        e.preventDefault()
        if (!addAdminTarget) return
        setAddingAdmin(true)
        try {
            await api.post(
                `/api/super-admin/universities/${addAdminTarget.id}/admins`,
                adminForm
            )
            push({ type: 'success', message: 'Admin added' })
            setAddAdminTarget(null)
            setAdminForm(emptyAdminForm)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to add admin' })
        } finally {
            setAddingAdmin(false)
        }
    }

    const handleImpersonate = async (university) => {
        setImpersonating(university.id)
        try {
            // Find the first admin for this university
            const usersRes = await api.get(
                `/api/super-admin/users?universityId=${university.id}&role=ADMIN&size=1&isActive=true`
            )
            const admins = usersRes.data.data?.content || []
            if (admins.length === 0) {
                push({ type: 'error', message: 'No active admin found for this university' })
                return
            }
            const admin = admins[0]

            // Get impersonation token
            const res = await api.post(`/api/super-admin/impersonate/${admin.id}`)
            const d = res.data.data

            // Save current super admin session
            startImpersonation(token, user, {
                userId: d.userId,
                email: d.email,
                fullName: d.fullName,
                role: d.role,
                universityId: d.universityId,
            })

            // Swap to impersonated auth
            setAuth(d.accessToken, {
                userId: d.userId,
                email: d.email,
                fullName: d.fullName,
                role: d.role,
                universityId: d.universityId,
            })
            refreshUniversity()

            push({ type: 'success', message: `Now viewing as ${d.fullName}` })

            // Navigate to the admin dashboard
            const dashboards = {
                SUPER_ADMIN: '/super-admin',
                ADMIN: '/admin',
                STAFF: '/staff',
                USER: '/student',
            }
            navigate(dashboards[d.role] || '/')
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Impersonation failed' })
        } finally {
            setImpersonating(null)
        }
    }

    if (loading) return <SkeletonStats count={4} />

    return (
        <>
            <div className="mb-6 flex justify-end">
                <Button
                    icon={Plus}
                    onClick={() => setShowCreate((v) => !v)}
                    variant={showCreate ? 'secondary' : 'primary'}
                >
                    {showCreate ? 'Cancel' : 'Register university'}
                </Button>
            </div>

            {analytics && (
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Universities" value={analytics.totalUniversities} icon={Building2} delay={0} />
                    <StatCard label="Total users" value={analytics.totalUsers} icon={Users} delay={0.05} />
                    <StatCard label="Active queues" value={analytics.activeQueues} icon={BarChart3} delay={0.1} />
                    <StatCard
                        label="Tickets today"
                        value={analytics.ticketsToday}
                        icon={BarChart3}
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
                            <form onSubmit={createUniversity} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input label="University name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="University of Lagos" required />
                                <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="UNILAG" required />
                                <Input label="Email domain" value={form.emailDomain} onChange={(e) => setForm({ ...form, emailDomain: e.target.value })} placeholder="@unilag.edu.ng" />
                                <Input label="Matric pattern (regex)" value={form.matricPattern} onChange={(e) => setForm({ ...form, matricPattern: e.target.value })} placeholder="^\\d{2}/\\d{5}/\\d{3}$" />
                                <Input label="Matric example" value={form.matricExample} onChange={(e) => setForm({ ...form, matricExample: e.target.value })} placeholder="21/12345/001" />
                                <Input label="Matric description" value={form.matricDescription} onChange={(e) => setForm({ ...form, matricDescription: e.target.value })} placeholder="YY/XXXXX/XXX" />
                                <Input label="First admin name" value={form.adminFullName} onChange={(e) => setForm({ ...form, adminFullName: e.target.value })} placeholder="Jane Doe" required />
                                <Input label="First admin email" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@unilag.edu.ng" required />
                                <Input label="First admin password" type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} placeholder="At least 8 characters" required />
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
                    <h3 className="text-sm font-semibold text-slate-900">Registered universities</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Actions</th>
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
                                    <td className="px-6 py-3 font-mono text-sm text-slate-700">{u.code}</td>
                                    <td className="px-6 py-3 text-sm text-slate-900">{u.name}</td>
                                    <td className="px-6 py-3 text-sm text-slate-600">{u.plan}</td>
                                    <td className="px-6 py-3">
                                        <Badge variant={u.isActive ? 'success' : 'default'}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleImpersonate(u)}
                                                disabled={impersonating === u.id}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 transition-colors hover:text-sky-700 disabled:opacity-50"
                                                title="Log in as this university's admin"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                {impersonating === u.id ? 'Loading…' : 'Login as admin'}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setAddAdminTarget(u)
                                                    setAdminForm(emptyAdminForm)
                                                }}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
                                            >
                                                <UserPlus className="h-3.5 w-3.5" />
                                                Add admin
                                            </button>

                                            <button
                                                onClick={() => handleToggle(u)}
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
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                </div>
            </Card>

            <ConfirmDialog
                open={!!confirmTarget}
                onClose={() => !toggling && setConfirmTarget(null)}
                onConfirm={() => performToggle(confirmTarget)}
                title={`Deactivate ${confirmTarget?.name}?`}
                description="All users of this university will be blocked from logging in. Data is preserved and you can reactivate at any time."
                confirmLabel="Deactivate"
                variant="danger"
                loading={toggling === confirmTarget?.id}
            />

            <AnimatePresence>
                {addAdminTarget && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !addingAdmin && setAddAdminTarget(null)}
                            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                            >
                                <button
                                    onClick={() => !addingAdmin && setAddAdminTarget(null)}
                                    className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                <h3 className="text-base font-semibold text-slate-900">
                                    Add admin to {addAdminTarget.name}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    They'll get full admin access for this university.
                                </p>

                                <form onSubmit={submitNewAdmin} className="mt-5 space-y-1">
                                    <Input label="Full name" value={adminForm.fullName} onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })} placeholder="Jane Doe" required />
                                    <Input label="Email" type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="admin2@unilag.edu.ng" required />
                                    <Input label="Password" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="At least 8 characters" required />
                                    <Input label="Department (optional)" value={adminForm.department} onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })} placeholder="e.g. Registry" />

                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="secondary" onClick={() => setAddAdminTarget(null)} disabled={addingAdmin}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" loading={addingAdmin} disabled={addingAdmin}>
                                            Add admin
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

export default function SuperAdminDashboard() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <PageHeader
                title="Platform Console"
                description="Manage universities, users, and monitor platform activity"
            />

            <div className="mb-6 border-b border-slate-200 sm:mb-8">
                <nav className="-mb-px flex gap-1 overflow-x-auto">
                    {tabs.map((t) => (
                        <NavLink
                            key={t.to}
                            to={t.to}
                            end={t.end}
                            className={({ isActive }) =>
                                `inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
                                    isActive
                                        ? 'border-brand-600 text-brand-600'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                }`
                            }
                        >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <Routes>
                <Route index element={<UniversitiesTab />} />
                <Route path="tiers" element={<TiersAndFeatures />} />
                <Route path="broadcast" element={<Broadcast />} />
                <Route path="analytics" element={<SystemAnalytics />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="*" element={<Navigate to="/super-admin" replace />} />
            </Routes>
        </div>
    )
}