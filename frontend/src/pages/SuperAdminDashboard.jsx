import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, Users, BarChart3, Plus, Power, PowerOff, History,
    UserPlus, X as CloseIcon, Layers, Megaphone, Eye, DollarSign,
    Pencil, Trash2, AlertTriangle, Palette, Settings as SettingsIcon, Inbox,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ImageUrlInput from '../components/ui/ImageUrlInput'
import DashboardLayout from '../components/layout/DashboardLayout'
import { SkeletonStats } from '../components/ui/Skeleton'
import { useToastStore } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import { useUniversityStore } from '../store/universityStore'
import { startImpersonation } from '../components/layout/ImpersonationBanner'
import { stagger, staggerItem, expand } from '../lib/motion'
import { DEFAULT_BRAND } from '../lib/colors'
import AuditLogs from './super-admin/AuditLogs'
import SystemAnalytics from './super-admin/SystemAnalytics'
import UsersPage from './super-admin/Users'
import TiersAndFeatures from './super-admin/TiersAndFeatures'
import Broadcast from './super-admin/Broadcast'
import Plans from './super-admin/Plans'
import AdmittedStudentsButton from './super-admin/AdmittedStudentsButton'
import Settings from './super-admin/Settings'
import UniversityApplications from './super-admin/UniversityApplications'

const PRESET_COLORS = [
    { label: 'Deep Navy',  value: '#1e3a8a' },
    { label: 'Indigo',     value: '#4f46e5' },
    { label: 'Royal Blue', value: '#2563eb' },
    { label: 'Emerald',    value: '#059669' },
    { label: 'Crimson',    value: '#b91c1c' },
    { label: 'Amber',      value: '#d97706' },
    { label: 'Violet',     value: '#7c3aed' },
    { label: 'Slate',      value: '#0f172a' },
    { label: 'Teal',       value: '#0d9488' },
]

function ColorPicker({ value, onChange }) {
    const current = value || DEFAULT_BRAND
    return (
        <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Palette className="h-3.5 w-3.5 text-slate-400" />
                Primary color
            </label>
            <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => onChange(item.value)}
                        title={item.label}
                        aria-label={item.label}
                        className={`h-9 w-9 rounded-lg border-2 transition-transform hover:scale-110 ${
                            current.toLowerCase() === item.value.toLowerCase()
                                ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-1 dark:border-white dark:ring-white'
                                : 'border-white shadow-sm dark:border-slate-700'
                        }`}
                        style={{ backgroundColor: item.value }}
                    />
                ))}
                <label className="ml-2 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                    <input
                        type="color"
                        value={current}
                        onChange={(event) => onChange(event.target.value)}
                        className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="font-mono text-xs uppercase text-slate-600 dark:text-slate-300">
                        {current}
                    </span>
                </label>
            </div>
        </div>
    )
}

const emptyForm = {
    name: '', code: '', emailDomain: '', adminFullName: '', adminEmail: '',
    adminPassword: '', matricPattern: '', matricExample: '', matricDescription: '',
    logoUrl: null, campusImageUrl: null, tagline: '', primaryColor: DEFAULT_BRAND,
}

const emptyAdminForm = { fullName: '', email: '', password: '', department: '', phone: '' }

const tabs = [
    { to: '/super-admin', label: 'Universities', icon: Building2, end: true },
    { to: '/super-admin/applications', label: 'Applications', icon: Inbox },
    { to: '/super-admin/plans', label: 'Plans', icon: DollarSign },
    { to: '/super-admin/tiers', label: 'Tiers & Features', icon: Layers },
    { to: '/super-admin/broadcast', label: 'Broadcast', icon: Megaphone },
    { to: '/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/super-admin/users', label: 'All Users', icon: Users },
    { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: History },
    { to: '/super-admin/settings', label: 'Platform Settings', icon: SettingsIcon }, // ⬅️ NEW
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
    const [editTarget, setEditTarget] = useState(null)
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState(emptyForm)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteConfirmCode, setDeleteConfirmCode] = useState('')
    const [toggling, setToggling] = useState(null)
    const [confirmDeactivate, setConfirmDeactivate] = useState(null)
    const [addAdminTarget, setAddAdminTarget] = useState(null)
    const [adminForm, setAdminForm] = useState(emptyAdminForm)
    const [addingAdmin, setAddingAdmin] = useState(false)
    const [impersonating, setImpersonating] = useState(null)

    const load = useCallback(async () => {
        try {
            const [userValue, firstValue] = await Promise.all([
                api.get('/api/super-admin/universities'),
                api.get('/api/super-admin/analytics').catch(() => ({ data: { data: null } })),
            ])
            setUniversities(userValue.data.data || [])
            setAnalytics(firstValue.data.data || null)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    const createUniversity = async (event) => {
        event.preventDefault()
        setCreating(true)
        try {
            await api.post('/api/super-admin/universities', form)
            push({ type: 'success', message: 'University registered' })
            setForm(emptyForm)
            setShowCreate(false)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to register' })
        } finally {
            setCreating(false)
        }
    }

    const openEdit = (userValue) => {
        setEditTarget(userValue)
        setEditForm({
            name: userValue.name || '', code: userValue.code || '', emailDomain: userValue.emailDomain || '',
            adminFullName: '', adminEmail: '', adminPassword: '', matricPattern: userValue.matricPattern || '',
            matricExample: userValue.matricExample || '', matricDescription: userValue.matricDescription || '',
            logoUrl: userValue.logoUrl || null, campusImageUrl: userValue.campusImageUrl || null,
            tagline: userValue.tagline || '', primaryColor: userValue.primaryColor || DEFAULT_BRAND,
        })
    }

    const closeEdit = () => { setEditTarget(null); setEditForm(emptyForm) }

    const saveEdit = async (e) => {
        e.preventDefault()
        if (!editTarget) return
        setEditing(true)
        try {
            await api.put(`/api/super-admin/universities/${editTarget.id}`, {
                name: editForm.name, emailDomain: editForm.emailDomain, matricPattern: editForm.matricPattern,
                matricExample: editForm.matricExample, matricDescription: editForm.matricDescription,
                logoUrl: editForm.logoUrl, campusImageUrl: editForm.campusImageUrl,
                tagline: editForm.tagline, primaryColor: editForm.primaryColor,
            })
            push({ type: 'success', message: 'University updated' })
            closeEdit(); await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to update' })
        } finally { setEditing(false) }
    }

    const performDelete = async () => {
        if (!deleteTarget) return
        if (deleteConfirmCode.trim().toUpperCase() !== deleteTarget.code.toUpperCase()) {
            push({ type: 'error', message: 'Code does not match' }); return
        }
        setDeleting(true)
        try {
            await api.delete(`/api/super-admin/universities/${deleteTarget.id}`)
            push({ type: 'success', message: `${deleteTarget.name} deleted` })
            setDeleteTarget(null); setDeleteConfirmCode(''); await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to delete' })
        } finally { setDeleting(false) }
    }

    const handleToggle = (u) => { if (u.isActive) setConfirmDeactivate(u); else performToggle(u) }

    const performToggle = async (u) => {
        setToggling(u.id)
        try {
            if (u.isActive) { await api.post(`/api/super-admin/universities/${u.id}/deactivate`); push({ type: 'success', message: `${u.name} deactivated` }) }
            else { await api.post(`/api/super-admin/universities/${u.id}/reactivate`); push({ type: 'success', message: `${u.name} reactivated` }) }
            setConfirmDeactivate(null); await load()
        } catch (err) { push({ type: 'error', message: err.response?.data?.message || 'Failed' }) } finally { setToggling(null) }
    }

    const submitNewAdmin = async (e) => {
        e.preventDefault(); if (!addAdminTarget) return; setAddingAdmin(true)
        try {
            await api.post(`/api/super-admin/universities/${addAdminTarget.id}/admins`, adminForm)
            push({ type: 'success', message: 'Admin added' }); setAddAdminTarget(null); setAdminForm(emptyAdminForm); await load()
        } catch (err) { push({ type: 'error', message: err.response?.data?.message || 'Failed to add admin' }) } finally { setAddingAdmin(false) }
    }

    const handleImpersonate = async (university) => {
        setImpersonating(university.id)
        try {
            const usersRes = await api.get(`/api/super-admin/users?universityId=${university.id}&role=ADMIN&size=1&isActive=true`)
            const admins = usersRes.data.data?.content || []
            if (admins.length === 0) { push({ type: 'error', message: 'No active admin found' }); return }
            const admin = admins[0]
            const res = await api.post(`/api/super-admin/impersonate/${admin.id}`)
            const d = res.data.data
            startImpersonation(token, user, { userId: d.userId, email: d.email, fullName: d.fullName, role: d.role, universityId: d.universityId })
            setAuth(d.accessToken, { userId: d.userId, email: d.email, fullName: d.fullName, role: d.role, universityId: d.universityId })
            refreshUniversity()
            push({ type: 'success', message: `Now viewing as ${d.fullName}` })
            navigate({ SUPER_ADMIN: '/super-admin', ADMIN: '/admin', STAFF: '/staff', USER: '/student' }[d.role] || '/')
        } catch (err) { push({ type: 'error', message: err.response?.data?.message || 'Impersonation failed' }) } finally { setImpersonating(null) }
    }

    if (loading) return <SkeletonStats count={4} />

    return (
        <>
            <div className="mb-6 flex justify-end">
                <Button icon={Plus} onClick={() => setShowCreate(!showCreate)} variant={showCreate ? 'secondary' : 'primary'}>
                    {showCreate ? 'Cancel' : 'Register university'}
                </Button>
            </div>

            {analytics && (
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Universities" value={analytics.totalUniversities} icon={Building2} delay={0} />
                    <StatCard label="Total users" value={analytics.totalUsers} icon={Users} delay={0.05} />
                    <StatCard label="Active queues" value={analytics.activeQueues} icon={BarChart3} delay={0.1} />
                    <StatCard label="Tickets today" value={analytics.ticketsToday} icon={BarChart3} delay={0.15} hint={`${analytics.ticketsAllTime ?? 0} all time`} />
                </div>
            )}

            <AnimatePresence>
                {showCreate && (
                    <motion.div variants={expand} initial="initial" animate="animate" exit="exit" className="mb-8 overflow-hidden">
                        <Card>
                            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Register a new university</h3>
                            <form onSubmit={createUniversity} className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input label="University name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="University of Lagos" required />
                                    <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="UNILAG" required />
                                    <Input label="Email domain" value={form.emailDomain} onChange={(e) => setForm({ ...form, emailDomain: e.target.value })} placeholder="@unilag.edu.ng" />
                                    <Input label="Tagline (optional)" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Skip the line. Not the service." />
                                </div>
                                <div>
                                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Matric number format</h4>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <Input label="Pattern (regex)" value={form.matricPattern} onChange={(e) => setForm({ ...form, matricPattern: e.target.value })} placeholder="^\\d{2}/\\d{5}/\\d{3}$" />
                                        <Input label="Example" value={form.matricExample} onChange={(e) => setForm({ ...form, matricExample: e.target.value })} placeholder="21/12345/001" />
                                        <Input label="Description" value={form.matricDescription} onChange={(e) => setForm({ ...form, matricDescription: e.target.value })} placeholder="YY/XXXXX/XXX" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Branding</h4>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <ImageUrlInput label="University logo URL" value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} placeholder="https://unilag.edu.ng/logo.png" hint="Right-click the school's logo → Copy image address." previewHeight="h-32" />
                                        <ImageUrlInput label="Campus photo URL" value={form.campusImageUrl} onChange={(url) => setForm({ ...form, campusImageUrl: url })} placeholder="https://unilag.edu.ng/campus.jpg" hint="Paste any public image URL." previewHeight="h-32" />
                                    </div>
                                    <div className="mt-4"><ColorPicker value={form.primaryColor} onChange={(hex) => setForm({ ...form, primaryColor: hex })} /></div>
                                </div>
                                <div>
                                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">First administrator</h4>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <Input label="Full name" value={form.adminFullName} onChange={(e) => setForm({ ...form, adminFullName: e.target.value })} placeholder="Jane Doe" required />
                                        <Input label="Email" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@unilag.edu.ng" required />
                                        <Input label="Password" type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} placeholder="At least 8 characters" required />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="secondary" onClick={() => { setForm(emptyForm); setShowCreate(false) }} disabled={creating}>Cancel</Button>
                                    <Button type="submit" loading={creating} disabled={creating}>Register university</Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Card padded={false}>
                <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Registered universities</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
                        </tr>
                        </thead>
                        <motion.tbody variants={stagger(0, 0.03)} initial="initial" animate="animate" className="divide-y divide-slate-100 dark:divide-slate-800">
                            {universities.map((u) => (
                                <motion.tr key={u.id} variants={staggerItem}>
                                    <td className="px-6 py-3 font-mono text-sm text-slate-700 dark:text-slate-300">{u.code}</td>
                                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                                        <div className="flex items-center gap-3">
                                            {u.logoUrl ? (
                                                <img src={u.logoUrl} alt={u.name} className="h-8 w-8 shrink-0 rounded-md object-contain ring-1 ring-slate-200 dark:ring-slate-700" onError={(e) => { e.target.style.display = 'none' }} />
                                            ) : (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{(u.code || '?').slice(0, 2)}</div>
                                            )}
                                            <span>{u.name}</span>
                                            <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: u.primaryColor || DEFAULT_BRAND }} title={`Brand color: ${u.primaryColor || DEFAULT_BRAND}`} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{u.plan}</td>
                                    <td className="px-6 py-3"><Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => openEdit(u)} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"><Pencil className="h-3.5 w-3.5" />Edit</button>
                                            <AdmittedStudentsButton university={u} />
                                            <button onClick={() => handleImpersonate(u)} disabled={impersonating === u.id} className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 transition-colors hover:text-sky-700 disabled:opacity-50"><Eye className="h-3.5 w-3.5" />{impersonating === u.id ? 'Loading…' : 'Login as admin'}</button>
                                            <button onClick={() => { setAddAdminTarget(u); setAdminForm(emptyAdminForm) }} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"><UserPlus className="h-3.5 w-3.5" />Add admin</button>
                                            <button onClick={() => handleToggle(u)} disabled={toggling === u.id} className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${u.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}>{u.isActive ? <><PowerOff className="h-3.5 w-3.5" />Deactivate</> : <><Power className="h-3.5 w-3.5" />Reactivate</>}</button>
                                            <button onClick={() => { setDeleteTarget(u); setDeleteConfirmCode('') }} className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 transition-colors hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                </div>
            </Card>

            <ConfirmDialog open={!!confirmDeactivate} onClose={() => !toggling && setConfirmDeactivate(null)} onConfirm={() => performToggle(confirmDeactivate)} title={`Deactivate ${confirmDeactivate?.name}?`} description="All users will be blocked from logging in. Data is preserved and you can reactivate at any time." confirmLabel="Deactivate" variant="danger" loading={toggling === confirmDeactivate?.id} />

            <AnimatePresence>
                {editTarget && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !editing && closeEdit()} className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
                        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()} className="relative my-8 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                                <button onClick={() => !editing && closeEdit()} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><CloseIcon className="h-4 w-4" /></button>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit {editTarget.name}</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update the university's details and branding.</p>
                                <form onSubmit={saveEdit} className="mt-6 space-y-6">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <Input label="University name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                                        <div><label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Code</label><input type="text" value={editForm.code} readOnly className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400" /><p className="mt-1 text-xs text-slate-500">Code is immutable.</p></div>
                                        <Input label="Email domain" value={editForm.emailDomain} onChange={(e) => setEditForm({ ...editForm, emailDomain: e.target.value })} placeholder="@unilag.edu.ng" />
                                        <Input label="Tagline" value={editForm.tagline} onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })} placeholder="Skip the line. Not the service." />
                                    </div>
                                    <div>
                                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Matric number format</h4>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <Input label="Pattern (regex)" value={editForm.matricPattern} onChange={(e) => setEditForm({ ...editForm, matricPattern: e.target.value })} />
                                            <Input label="Example" value={editForm.matricExample} onChange={(e) => setEditForm({ ...editForm, matricExample: e.target.value })} />
                                            <Input label="Description" value={editForm.matricDescription} onChange={(e) => setEditForm({ ...editForm, matricDescription: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Branding</h4>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <ImageUrlInput label="University logo URL" value={editForm.logoUrl} onChange={(url) => setEditForm({ ...editForm, logoUrl: url })} placeholder="https://unilag.edu.ng/logo.png" hint="Right-click the school's logo → Copy image address." previewHeight="h-32" />
                                            <ImageUrlInput label="Campus photo URL" value={editForm.campusImageUrl} onChange={(url) => setEditForm({ ...editForm, campusImageUrl: url })} placeholder="https://unilag.edu.ng/campus.jpg" hint="Paste any public image URL." previewHeight="h-32" />
                                        </div>
                                        <div className="mt-4"><ColorPicker value={editForm.primaryColor} onChange={(hex) => setEditForm({ ...editForm, primaryColor: hex })} /></div>
                                    </div>
                                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><Button type="button" variant="secondary" onClick={closeEdit} disabled={editing}>Cancel</Button><Button type="submit" loading={editing} disabled={editing}>Save changes</Button></div>
                                </form>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !deleting && setDeleteTarget(null)} className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900 dark:bg-slate-900">
                                <button onClick={() => !deleting && setDeleteTarget(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><CloseIcon className="h-4 w-4" /></button>
                                <div className="mb-5 flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40"><AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" /></div>
                                    <div><h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Delete {deleteTarget.name}?</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This permanently removes the university and <strong>all</strong> its data: users, queues, tickets, feedback, and notifications. This cannot be undone.</p></div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"><label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">Type <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono font-bold text-slate-900 dark:bg-slate-700 dark:text-slate-100">{deleteTarget.code}</span> to confirm</label><input type="text" value={deleteConfirmCode} onChange={(e) => setDeleteConfirmCode(e.target.value)} placeholder={deleteTarget.code} autoFocus className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
                                <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button><Button type="button" onClick={performDelete} loading={deleting} disabled={deleting || deleteConfirmCode.trim().toUpperCase() !== deleteTarget.code.toUpperCase()} className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500">Delete permanently</Button></div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {addAdminTarget && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !addingAdmin && setAddAdminTarget(null)} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                <button onClick={() => !addingAdmin && setAddAdminTarget(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><CloseIcon className="h-4 w-4" /></button>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Add admin to {addAdminTarget.name}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">They'll get full admin access for this university.</p>
                                <form onSubmit={submitNewAdmin} className="mt-5 space-y-1">
                                    <Input label="Full name" value={adminForm.fullName} onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })} placeholder="Jane Doe" required />
                                    <Input label="Email" type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="admin2@unilag.edu.ng" required />
                                    <Input label="Password" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="At least 8 characters" required />
                                    <Input label="Department (optional)" value={adminForm.department} onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })} placeholder="e.g. Registry" />
                                    <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setAddAdminTarget(null)} disabled={addingAdmin}>Cancel</Button><Button type="submit" loading={addingAdmin} disabled={addingAdmin}>Add admin</Button></div>
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
        <DashboardLayout tabs={tabs} title="Platform Console" description="Manage universities, users, and monitor platform activity">
            <Routes>
                <Route index element={<UniversitiesTab />} />
                <Route path="plans" element={<Plans />} />
                <Route path="tiers" element={<TiersAndFeatures />} />
                <Route path="broadcast" element={<Broadcast />} />
                <Route path="analytics" element={<SystemAnalytics />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="applications" element={<UniversityApplications />} />
                <Route path="*" element={<Navigate to="/super-admin" replace />} />
            </Routes>
        </DashboardLayout>
    )
}