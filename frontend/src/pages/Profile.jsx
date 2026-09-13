import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    User,
    Mail,
    Phone,
    Building2,
    Hash,
    GraduationCap,
    Shield,
    Lock,
    Save,
    Loader2,
    CheckCircle2,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { getInitials, formatDate } from '../lib/format'
import { fadeUp, stagger, staggerItem } from '../lib/motion'

const roleLabels = {
    SUPER_ADMIN: 'Super Administrator',
    ADMIN: 'University Administrator',
    STAFF: 'Staff',
    USER: 'Student',
}

const roleBadge = {
    SUPER_ADMIN: 'indigo',
    ADMIN: 'info',
    STAFF: 'warning',
    USER: 'success',
}

export default function Profile() {
    const { user: authUser } = useAuthStore()
    const { push } = useToastStore()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [changingPw, setChangingPw] = useState(false)

    const [form, setForm] = useState({
        fullName: '',
        department: '',
        phone: '',
    })

    const [pwForm, setPwForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/profile')
            const p = res.data.data
            setProfile(p)
            setForm({
                fullName: p.fullName || '',
                department: p.department || '',
                phone: p.phone || '',
            })
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load profile' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    const saveProfile = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await api.put('/api/profile', form)
            setProfile(res.data.data)
            push({ type: 'success', message: 'Profile updated' })

            // Update auth store so navbar reflects changes
            const stored = JSON.parse(localStorage.getItem('uniqueue_user') || '{}')
            const updated = { ...stored, fullName: res.data.data.fullName }
            localStorage.setItem('uniqueue_user', JSON.stringify(updated))
            useAuthStore.setState({ user: updated })
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to save' })
        } finally {
            setSaving(false)
        }
    }

    const changePassword = async (e) => {
        e.preventDefault()
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            push({ type: 'error', message: 'New passwords do not match' })
            return
        }
        if (pwForm.newPassword.length < 8) {
            push({ type: 'error', message: 'Password must be at least 8 characters' })
            return
        }

        setChangingPw(true)
        try {
            await api.put('/api/profile/password', {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
            })
            push({ type: 'success', message: 'Password changed' })
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to change password' })
        } finally {
            setChangingPw(false)
        }
    }

    if (loading) return <Spinner label="Loading profile…" />

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
                variants={fadeUp}
                initial="initial"
                animate="animate"
                className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start"
            >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
                    {getInitials(profile.fullName)}
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        {profile.fullName}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <Badge variant={roleBadge[profile.role] || 'default'}>
                            {roleLabels[profile.role] || profile.role}
                        </Badge>
                        {profile.universityCode && (
                            <Badge variant="default">{profile.universityCode}</Badge>
                        )}
                        {profile.isVerified && (
                            <Badge variant="success">
                                <CheckCircle2 className="mr-1 inline h-3 w-3" />
                                Verified
                            </Badge>
                        )}
                    </div>
                </div>
            </motion.div>

            <motion.div
                variants={stagger(0, 0.06)}
                initial="initial"
                animate="animate"
                className="space-y-6"
            >
                {/* Read-only info */}
                <motion.div variants={staggerItem}>
                    <Card>
                        <h2 className="mb-4 text-base font-semibold text-slate-900">
                            Account details
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <ReadOnlyRow icon={Mail} label="Email" value={profile.email} />
                            <ReadOnlyRow
                                icon={Building2}
                                label="University"
                                value={profile.universityName || '—'}
                            />
                            {profile.matricNumber && (
                                <ReadOnlyRow
                                    icon={Hash}
                                    label="Matric number"
                                    value={profile.matricNumber}
                                />
                            )}
                            {profile.role && (
                                <ReadOnlyRow
                                    icon={Shield}
                                    label="Role"
                                    value={roleLabels[profile.role] || profile.role}
                                />
                            )}
                            {profile.createdAt && (
                                <ReadOnlyRow
                                    icon={GraduationCap}
                                    label="Joined"
                                    value={formatDate(profile.createdAt)}
                                />
                            )}
                        </div>
                    </Card>
                </motion.div>

                {/* Editable info */}
                <motion.div variants={staggerItem}>
                    <Card>
                        <h2 className="mb-1 text-base font-semibold text-slate-900">
                            Personal information
                        </h2>
                        <p className="mb-4 text-xs text-slate-500">
                            Update your name, department, and phone number.
                        </p>
                        <form onSubmit={saveProfile}>
                            <Input
                                label="Full name"
                                value={form.fullName}
                                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                icon={User}
                                required
                            />
                            <Input
                                label="Department"
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                placeholder="e.g. Computer Science"
                                icon={Building2}
                            />
                            <Input
                                label="Phone number"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="e.g. 08012345678"
                                icon={Phone}
                            />
                            <Button type="submit" loading={saving} disabled={saving} icon={Save}>
                                {saving ? 'Saving…' : 'Save changes'}
                            </Button>
                        </form>
                    </Card>
                </motion.div>

                {/* Password */}
                <motion.div variants={staggerItem}>
                    <Card>
                        <h2 className="mb-1 text-base font-semibold text-slate-900">
                            Change password
                        </h2>
                        <p className="mb-4 text-xs text-slate-500">
                            Use at least 8 characters. Keep it private.
                        </p>
                        <form onSubmit={changePassword} className="space-y-1">
                            <Input
                                label="Current password"
                                type="password"
                                value={pwForm.currentPassword}
                                onChange={(e) =>
                                    setPwForm({ ...pwForm, currentPassword: e.target.value })
                                }
                                icon={Lock}
                                required
                                autoComplete="current-password"
                            />
                            <Input
                                label="New password"
                                type="password"
                                value={pwForm.newPassword}
                                onChange={(e) =>
                                    setPwForm({ ...pwForm, newPassword: e.target.value })
                                }
                                icon={Lock}
                                required
                                autoComplete="new-password"
                                hint="At least 8 characters"
                            />
                            <Input
                                label="Confirm new password"
                                type="password"
                                value={pwForm.confirmPassword}
                                onChange={(e) =>
                                    setPwForm({ ...pwForm, confirmPassword: e.target.value })
                                }
                                icon={Lock}
                                required
                                autoComplete="new-password"
                            />
                            <Button type="submit" variant="secondary" loading={changingPw} disabled={changingPw}>
                                {changingPw ? 'Changing…' : 'Change password'}
                            </Button>
                        </form>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    )
}

function ReadOnlyRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Icon className="h-4 w-4 text-slate-500" />
            </div>
            <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {label}
                </div>
                <div className="truncate text-sm font-medium text-slate-900">
                    {value || '—'}
                </div>
            </div>
        </div>
    )
}