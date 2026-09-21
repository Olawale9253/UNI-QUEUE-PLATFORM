import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    User as UserIcon,
    Mail,
    Building2,
    Shield,
    Lock,
    Check,
    AlertCircle,
    Eye,
    EyeOff,
    Phone,
    Briefcase,
    Hash,
    Landmark,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { SkeletonRow } from '../components/ui/Skeleton'
import { useAuthStore } from '../store/authStore'
import { useUniversityStore } from '../store/universityStore'
import { useToastStore } from '../store/toastStore'
import { getInitials } from '../lib/format'

const ROLE_LABELS = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    STAFF: 'Staff',
    USER: 'Student',
}

const ROLE_VARIANTS = {
    SUPER_ADMIN: 'indigo',
    ADMIN: 'warning',
    STAFF: 'info',
    USER: 'default',
}

// ── Reusable password input with show/hide toggle ──
function PasswordField({ label, value, onChange, placeholder, autoComplete }) {
    const [show, setShow] = useState(false)
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
                <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={show ? 'Hide password' : 'Show password'}
                >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    )
}

export default function Profile() {
    const { user, refreshProfile } = useAuthStore()
    const { refresh: refreshUniversity } = useUniversityStore()
    const { push } = useToastStore()
    const navigate = useNavigate()

    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)

    const [profileForm, setProfileForm] = useState({
        fullName: '',
        department: '',
        phone: '',
    })
    const [savingProfile, setSavingProfile] = useState(false)

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [savingPassword, setSavingPassword] = useState(false)

    // ── Role flags ──
    const role = profile?.role || user?.role
    const isSuperAdmin = role === 'SUPER_ADMIN'
    const isAdmin = role === 'ADMIN'
    const isStudent = role === 'USER'

    // ── Role-aware labels ──
    const departmentLabel = isAdmin ? 'Office / Unit' : 'Department'
    const departmentPlaceholder = isAdmin
        ? "e.g. Registry, Bursar's Office"
        : 'e.g. Computer Science'

    // ── Back target by role ──
    const dashboards = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        STAFF: '/staff',
        USER: '/student',
    }
    const backHref = dashboards[role] || '/'

    // ── Load profile on mount ──
    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const res = await api.get('/api/profile')
                if (cancelled) return
                const p = res.data?.data
                setProfile(p)
                setProfileForm({
                    fullName: p?.fullName || '',
                    department: p?.department || '',
                    phone: p?.phone || '',
                })
            } catch (err) {
                if (cancelled) return
                setLoadError(err.response?.data?.message || 'Failed to load profile')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [])

    // ── Update profile ──
    const updateProfile = async (e) => {
        e.preventDefault()
        if (!profileForm.fullName.trim()) {
            push({ type: 'error', message: 'Full name is required' })
            return
        }
        setSavingProfile(true)
        try {
            // Build payload — hide department for super admin
            const payload = {
                fullName: profileForm.fullName.trim(),
                phone: profileForm.phone.trim() || null,
            }
            if (!isSuperAdmin) {
                payload.department = profileForm.department.trim() || null
            }

            const res = await api.put('/api/profile', payload)
            const updated = res.data?.data
            if (updated) {
                setProfile(updated)
                await refreshProfile()
                if (refreshUniversity) refreshUniversity()
            }
            push({ type: 'success', message: 'Profile updated' })
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to update profile',
            })
        } finally {
            setSavingProfile(false)
        }
    }

    // ── Change password ──
    const changePassword = async (e) => {
        e.preventDefault()
        if (passwordForm.newPassword.length < 8) {
            push({ type: 'error', message: 'New password must be at least 8 characters' })
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            push({ type: 'error', message: 'Passwords do not match' })
            return
        }
        setSavingPassword(true)
        try {
            await api.put('/api/profile/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })
            push({ type: 'success', message: 'Password changed successfully' })
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to change password',
            })
        } finally {
            setSavingPassword(false)
        }
    }

    // ── Password strength meter ──
    const passwordStrength = (() => {
        const p = passwordForm.newPassword
        if (!p) return null
        let score = 0
        if (p.length >= 8) score++
        if (p.length >= 12) score++
        if (/[A-Z]/.test(p)) score++
        if (/[0-9]/.test(p)) score++
        if (/[^A-Za-z0-9]/.test(p)) score++
        if (score <= 2)
            return { label: 'Weak', color: 'text-rose-600', bar: 'bg-rose-500', w: 'w-1/3' }
        if (score <= 3)
            return { label: 'Fair', color: 'text-amber-600', bar: 'bg-amber-500', w: 'w-2/3' }
        return { label: 'Strong', color: 'text-emerald-600', bar: 'bg-emerald-500', w: 'w-full' }
    })()

    const display = profile || user

    // ── Loading state ──
    if (loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <Card className="mb-6">
                    <div className="flex items-center gap-5">
                        <div className="h-20 w-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                        <div className="flex-1 space-y-2">
                            <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                        </div>
                    </div>
                </Card>
                <Card className="mb-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonRow key={i} />
                    ))}
                </Card>
            </div>
        )
    }

    // ── Error state ──
    if (loadError) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <button
                    onClick={() => navigate(backHref)}
                    className="mb-6 -ml-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to dashboard
                </button>
                <Card>
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40">
                            <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Couldn't load profile
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{loadError}</p>
                        </div>
                        <Button variant="secondary" onClick={() => window.location.reload()}>
                            Try again
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            {/* ───── Back button ───── */}
            <button
                onClick={() => navigate(backHref)}
                className="mb-6 -ml-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
            </button>

            {/* ───── Header card ───── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <Card className="mb-6 overflow-hidden">
                    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                        {/* Avatar — university logo if available, else initials */}
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                            {profile?.universityLogoUrl ? (
                                <img
                                    src={profile.universityLogoUrl}
                                    alt={profile.universityName || 'University'}
                                    className="h-full w-full object-contain p-2"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-slate-900 text-2xl font-semibold text-white dark:bg-slate-700">
                                    {getInitials(display?.fullName)}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                {display?.fullName || 'Your profile'}
                            </h1>
                            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500 dark:text-slate-400">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                {display?.email}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge variant={ROLE_VARIANTS[role] || 'default'}>
                                    <Shield className="mr-1 h-3 w-3" />
                                    {ROLE_LABELS[role] || role}
                                </Badge>

                                {!isSuperAdmin && profile?.universityName && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Building2 className="h-3 w-3 text-slate-400" />
                                        {profile.universityName}
                                        {profile.universityCode && (
                                            <span className="font-mono text-[10px] text-slate-500">
                        · {profile.universityCode}
                      </span>
                                        )}
                  </span>
                                )}

                                {/* Matric number only makes sense for students */}
                                {isStudent && profile?.matricNumber && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Hash className="h-3 w-3 text-slate-400" />
                                        {profile.matricNumber}
                  </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* ───── Profile form ───── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
            >
                <Card className="mb-6">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
                            <UserIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Personal information
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Update your details. Email can't be changed here.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={updateProfile} className="space-y-4">
                        {/* Full name */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Full name
                            </label>
                            <input
                                type="text"
                                value={profileForm.fullName}
                                onChange={(e) =>
                                    setProfileForm({ ...profileForm, fullName: e.target.value })
                                }
                                placeholder="Your full name"
                                required
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                            />
                        </div>

                        {/* Email (read-only) */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={display?.email || ''}
                                readOnly
                                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Contact your administrator to change your email.
                            </p>
                        </div>

                        {/* Department (hidden for super admin) + Phone */}
                        <div
                            className={`grid grid-cols-1 gap-4 ${
                                !isSuperAdmin ? 'sm:grid-cols-2' : ''
                            }`}
                        >
                            {!isSuperAdmin && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {departmentLabel}
                                    </label>
                                    <div className="relative">
                                        {isAdmin ? (
                                            <Landmark className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        ) : (
                                            <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        )}
                                        <input
                                            type="text"
                                            value={profileForm.department}
                                            onChange={(e) =>
                                                setProfileForm({ ...profileForm, department: e.target.value })
                                            }
                                            placeholder={departmentPlaceholder}
                                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Phone number
                                </label>
                                <div className="relative">
                                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) =>
                                            setProfileForm({ ...profileForm, phone: e.target.value })
                                        }
                                        placeholder="+234 801 234 5678"
                                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" loading={savingProfile} disabled={savingProfile}>
                                Save changes
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>

            {/* ───── Password form ───── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
            >
                <Card>
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Change password
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Use at least 8 characters with a mix of letters, numbers, and symbols
                            </p>
                        </div>
                    </div>

                    <form onSubmit={changePassword} className="space-y-4">
                        <PasswordField
                            label="Current password"
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                                setPasswordForm({
                                    ...passwordForm,
                                    currentPassword: e.target.value,
                                })
                            }
                            placeholder="Enter current password"
                            autoComplete="current-password"
                        />

                        <PasswordField
                            label="New password"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                            }
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                        />

                        {/* Strength bar */}
                        <AnimatePresence>
                            {passwordStrength && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="-mt-2 overflow-hidden"
                                >
                                    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                        <div
                                            className={`h-full ${passwordStrength.bar} ${passwordStrength.w} transition-all duration-300`}
                                        />
                                    </div>
                                    <p className={`mt-1 text-xs font-medium ${passwordStrength.color}`}>
                                        {passwordStrength.label}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <PasswordField
                            label="Confirm new password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                                setPasswordForm({
                                    ...passwordForm,
                                    confirmPassword: e.target.value,
                                })
                            }
                            placeholder="Re-enter new password"
                            autoComplete="new-password"
                        />

                        {/* Match indicator */}
                        {passwordForm.confirmPassword && (
                            <div>
                                {passwordForm.newPassword === passwordForm.confirmPassword ? (
                                    <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                        <Check className="h-3 w-3" />
                                        Passwords match
                                    </p>
                                ) : (
                                    <p className="flex items-center gap-1 text-xs font-medium text-rose-600">
                                        <AlertCircle className="h-3 w-3" />
                                        Passwords don't match
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button type="submit" loading={savingPassword} disabled={savingPassword}>
                                Update password
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    )
}