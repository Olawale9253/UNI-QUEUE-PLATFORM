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
    GraduationCap,
    ArrowRight,
    ShieldCheck,
    BellRing,
    CheckCircle2,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { SkeletonRow } from '../components/ui/Skeleton'
import ChangeEmailModal from '../components/profile/ChangeEmailModal'
import SignOutAllButton from '../components/SignOutAllButton'
import { useAuthStore } from '../store/authStore'
import { useUniversityStore } from '../store/universityStore'
import { useToastStore } from '../store/toastStore'
import { useWebPush } from '../hooks/useWebPush'
import { getInitials } from '../lib/format'

const ROLE_LABELS = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    STAFF: 'Staff',
    USER: 'Student',
    FRESHER: 'Fresher',
}

const ROLE_VARIANTS = {
    SUPER_ADMIN: 'indigo',
    ADMIN: 'warning',
    STAFF: 'info',
    USER: 'default',
    FRESHER: 'info',
}

/**
 * Push-notification copy varies by role.
 * Students get "your turn" language; staff and admins get queue-health
 * language. Without this, a university admin sees "Get alerted when it's
 * your turn" — which is confusing because admins don't join queues.
 */
function getNotificationCopy(role) {
    switch (role) {
        case 'SUPER_ADMIN':
            return {
                heading: 'Get notified about the universities you manage.',
                active: "Active — you'll get a popup on this device for cross-university alerts.",
                off: 'Off — turn on to receive admin alerts.',
            }
        case 'ADMIN':
            return {
                heading: 'Get notified when a queue needs your attention.',
                active: "Active — you'll get a popup on this device when a service is under strain.",
                off: 'Off — turn on to receive admin alerts.',
            }
        case 'STAFF':
            return {
                heading: 'Get notified when a student needs service.',
                active: "Active — you'll get a popup on this device when a ticket is assigned to you.",
                off: 'Off — turn on to receive service alerts.',
            }
        case 'USER':
        case 'FRESHER':
        default:
            return {
                heading: "Get alerted when it's your turn, even when the app is closed.",
                active: "Active — you'll get a popup on this device when something happens to your queue.",
                off: "Off — turn on to get notified when it's your turn.",
            }
    }
}

/**
 * Returns the status text below "Push notifications" — either the role's
 * generic state, or a specific reason the browser can't do push.
 */
function getPushStatusText(webPush, notifications) {
    // Enabled & subscribed
    if (webPush.subscription) return notifications.active

    // Unsupported — explain why
    if (!webPush.supported) {
        switch (webPush.reason) {
            case 'ios-not-installed':
                return 'Push notifications on iPhone require the app to be added to your Home Screen. Tap the Share icon at the bottom of Safari → "Add to Home Screen" → then open UniQueue from your Home Screen. (iOS 16.4+)'
            case 'in-app-browser':
                return 'Push notifications aren\'t available in this in-app browser. Open UniQueue in Safari or Chrome to enable them.'
            case 'insecure-context':
                return 'Push notifications require a secure (HTTPS) connection.'
            case 'browser-unsupported':
                return 'Your browser does not support push notifications.'
            default:
                return 'Push notifications are unavailable.'
        }
    }

    // Supported but blocked by the user
    if (webPush.permission === 'denied') {
        return 'Blocked. Enable notifications in your browser settings and reload.'
    }

    // Supported but not yet enabled
    return notifications.off
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
                <button
                    type="button"
                    onClick={() => setShow((item) => !item)}
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
    const { user, refreshProfile, logout } = useAuthStore()
    const { refresh: refreshUniversity } = useUniversityStore()
    const { push } = useToastStore()
    const webPush = useWebPush()
    const navigate = useNavigate()

    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)

    const [profileForm, setProfileForm] = useState({ fullName: '', department: '', phone: '' })
    const [savingProfile, setSavingProfile] = useState(false)

    const [matricInput, setMatricInput] = useState('')
    const [upgrading, setUpgrading] = useState(false)

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [savingPassword, setSavingPassword] = useState(false)

    const [showEmailModal, setShowEmailModal] = useState(false)

    const role = profile?.role || user?.role
    const isSuperAdmin = role === 'SUPER_ADMIN'
    const isAdmin = role === 'ADMIN'
    const isStudent = role === 'USER'
    const isFresher = role === 'FRESHER'

    const notifications = getNotificationCopy(role)
    const pushStatusText = getPushStatusText(webPush, notifications)

    const dashboards = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        STAFF: '/staff',
        USER: '/student',
        FRESHER: '/student',
    }
    const backHref = dashboards[role] || '/'

    // ── Load profile ──
    const load = async () => {
        try {
            const res = await api.get('/api/profile')
            const parameter = res.data?.data
            setProfile(parameter)
            setProfileForm({
                fullName: parameter?.fullName || '',
                department: parameter?.department || '',
                phone: parameter?.phone || '',
            })
        } catch (err) {
            setLoadError(err.response?.data?.message || 'Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const updateProfile = async (event) => {
        event.preventDefault()
        if (!profileForm.fullName.trim()) {
            push({ type: 'error', message: 'Full name is required' })
            return
        }
        setSavingProfile(true)
        try {
            const payload = {
                fullName: profileForm.fullName.trim(),
                phone: profileForm.phone.trim() || null,
            }
            if (!isSuperAdmin) payload.department = profileForm.department.trim() || null

            await api.put('/api/profile', payload)
            await load()
            await refreshProfile()
            if (refreshUniversity) refreshUniversity()
            push({ type: 'success', message: 'Profile updated' })
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to update profile' })
        } finally {
            setSavingProfile(false)
        }
    }

    // ── Fresher → Student upgrade ──
    const upgradeToStudent = async (eventValue) => {
        eventValue.preventDefault()
        if (!matricInput.trim()) {
            push({ type: 'error', message: 'Enter your matric number' })
            return
        }
        setUpgrading(true)
        try {
            await api.put('/api/profile', { matricNumber: matricInput.trim() })
            await load()
            await refreshProfile()
            push({ type: 'success', message: 'Upgraded to student! You now have full access.' })
            setMatricInput('')
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Upgrade failed' })
        } finally {
            setUpgrading(false)
        }
    }

    const changePassword = async (eventValue2) => {
        eventValue2.preventDefault()
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
            const res = await api.put('/api/profile/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })

            // Backend returns fresh tokens because it bumped tokenVersion.
            const dateValue = res.data?.data
            if (dateValue?.accessToken) {
                useAuthStore.getState().updateTokens(dateValue.accessToken, dateValue.refreshToken)
            }

            push({ type: 'success', message: 'Password changed successfully' })
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to change password' })
        } finally {
            setSavingPassword(false)
        }
    }

    const handleEmailChanged = async () => {
        setShowEmailModal(false)
        push({
            type: 'info',
            message: 'Email updated. Please sign in again with your new email.',
            duration: 5000,
        })
        setTimeout(() => {
            logout()
            navigate('/login')
        }, 1500)
    }

    const display = profile || user

    const inputClass =
        'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'

    const labelClass =
        'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300'

    // ── Loading state ──
    if (loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <Card className="mb-6">
                    <SkeletonRow />
                </Card>
                <Card className="mb-6">
                    <SkeletonRow />
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
                    className="mb-6 -ml-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to dashboard
                </button>
                <Card>
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <AlertCircle className="h-6 w-6 text-rose-600" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">{loadError}</p>
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

            {/* ───── HEADER ───── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <Card className="mb-6 overflow-hidden">
                    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
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
                  </span>
                                )}

                                {isStudent && profile?.matricNumber && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {profile.matricNumber}
                  </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* ───── FRESHER UPGRADE CARD ───── */}
            {isFresher && profile?.canUpgrade && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.04 }}
                >
                    <Card className="mb-6 overflow-hidden border-brand-200 bg-gradient-to-br from-brand-50 to-white dark:border-brand-900 dark:from-brand-950/40 dark:to-slate-900">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Received your matric number?
                                </h2>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                    Enter it below to upgrade to full student access. You'll
                                    immediately unlock all queues at your university.
                                </p>

                                <form onSubmit={upgradeToStudent} className="mt-4 flex flex-col gap-2 sm:flex-row">
                                    <input
                                        type="text"
                                        value={matricInput}
                                        onChange={(eventValue3) => setMatricInput(eventValue3.target.value)}
                                        placeholder="Enter your matric number"
                                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                                    />
                                    <Button type="submit" loading={upgrading} disabled={upgrading}>
                                        {upgrading ? 'Upgrading…' : 'Upgrade account'}
                                        {!upgrading && <ArrowRight className="ml-1 h-4 w-4" />}
                                    </Button>
                                </form>

                                {profile?.matricPatternHint && (
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        Format: <span className="font-mono">{profile.matricPatternHint}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {isFresher && !profile?.canUpgrade && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 }}
                >
                    <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            <div>
                                <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                    You're registered as a fresher
                                </h2>
                                <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                                    Your university hasn't set up a matric number format yet. Contact
                                    your admin once you receive your matric.
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* ───── LOGIN & SECURITY ───── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
            >
                <Card className="mb-6">
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
                            <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Login credentials
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Your email and how to access your account
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Email address
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                {display?.email}
                            </div>
                            {profile?.recoveryEmail && (
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold uppercase tracking-wide">Recovery:</span>{' '}
                                    <span className="font-mono">{profile.recoveryEmail}</span>
                                </div>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowEmailModal(true)}
                            className="shrink-0"
                        >
                            Change email
                        </Button>
                    </div>
                </Card>
            </motion.div>

            {/* ───── NOTIFICATIONS — reason-aware ───── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 }}
            >
                <Card className="mb-6">
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
                            <BellRing className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Notifications
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {notifications.heading}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                Push notifications
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {pushStatusText}
                            </p>
                            {webPush.subscription && (
                                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Subscribed on this device
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            disabled={
                                !webPush.supported ||
                                webPush.permission === 'denied' ||
                                webPush.busy
                            }
                            onClick={async () => {
                                if (webPush.subscription) {
                                    await webPush.unsubscribe()
                                    push({ type: 'info', message: 'Push notifications disabled' })
                                } else {
                                    const result = await webPush.subscribe()
                                    if (result === 'granted') {
                                        push({ type: 'success', message: 'Push notifications enabled' })
                                    } else if (result === 'denied') {
                                        push({ type: 'error', message: 'Permission denied' })
                                    } else if (result !== 'unsupported') {
                                        push({ type: 'error', message: 'Could not enable notifications' })
                                    }
                                }
                            }}
                            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                                webPush.subscription
                                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                                    : 'bg-brand-600 text-white hover:bg-brand-700'
                            }`}
                        >
                            {webPush.subscription
                                ? 'Turn off'
                                : webPush.supported
                                    ? 'Enable'
                                    : 'Unavailable'}
                        </button>
                    </div>
                </Card>
            </motion.div>

            {/* ───── PERSONAL INFO ───── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
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
                                Update your details
                            </p>
                        </div>
                    </div>

                    <form onSubmit={updateProfile} className="space-y-4">
                        <div>
                            <label className={labelClass}>Full name</label>
                            <input
                                type="text"
                                value={profileForm.fullName}
                                onChange={(eventValue4) => setProfileForm({ ...profileForm, fullName: eventValue4.target.value })}
                                placeholder="Enter your full name"
                                required
                                className={inputClass}
                            />
                        </div>

                        {isFresher && profile?.jambRegNumber && (
                            <div>
                                <label className={labelClass}>JAMB registration number</label>
                                <input
                                    type="text"
                                    value={profile.jambRegNumber}
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                                />
                            </div>
                        )}

                        <div className={`grid grid-cols-1 gap-4 ${!isSuperAdmin ? 'sm:grid-cols-2' : ''}`}>
                            {!isSuperAdmin && (
                                <div>
                                    <label className={labelClass}>
                                        {isAdmin ? 'Office / Unit' : 'Department'}
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.department}
                                        onChange={(eventValue5) => setProfileForm({ ...profileForm, department: eventValue5.target.value })}
                                        placeholder={isAdmin ? 'Enter your office or unit' : 'Enter your department'}
                                        className={inputClass}
                                    />
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Phone number</label>
                                <input
                                    type="tel"
                                    value={profileForm.phone}
                                    onChange={(eventValue6) => setProfileForm({ ...profileForm, phone: eventValue6.target.value })}
                                    placeholder="Enter your phone number"
                                    className={inputClass}
                                />
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

            {/* ───── PASSWORD ───── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
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
                                At least 8 characters
                            </p>
                        </div>
                    </div>

                    <form onSubmit={changePassword} className="space-y-4">
                        <PasswordField
                            label="Current password"
                            value={passwordForm.currentPassword}
                            onChange={(eventValue7) =>
                                setPasswordForm({ ...passwordForm, currentPassword: eventValue7.target.value })
                            }
                            placeholder="Enter your current password"
                            autoComplete="current-password"
                        />
                        <PasswordField
                            label="New password"
                            value={passwordForm.newPassword}
                            onChange={(eventValue8) =>
                                setPasswordForm({ ...passwordForm, newPassword: eventValue8.target.value })
                            }
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                        />
                        <PasswordField
                            label="Confirm new password"
                            value={passwordForm.confirmPassword}
                            onChange={(eventValue9) =>
                                setPasswordForm({ ...passwordForm, confirmPassword: eventValue9.target.value })
                            }
                            placeholder="Re-enter new password"
                            autoComplete="new-password"
                        />

                        {passwordForm.confirmPassword && (
                            <div>
                                {passwordForm.newPassword === passwordForm.confirmPassword ? (
                                    <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                        <Check className="h-3 w-3" /> Passwords match
                                    </p>
                                ) : (
                                    <p className="flex items-center gap-1 text-xs font-medium text-rose-600">
                                        <AlertCircle className="h-3 w-3" /> Passwords don't match
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

                    {/* ───── SIGN OUT ALL DEVICES ───── */}
                    <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    Sign out of all devices
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Revokes every active session on every device. Use this if you
                                    think someone else has access to your account.
                                </p>
                            </div>
                            <SignOutAllButton variant="danger" />
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* ───── EMAIL CHANGE MODAL ───── */}
            <AnimatePresence>
                {showEmailModal && (
                    <ChangeEmailModal
                        currentEmail={display?.email}
                        onClose={() => setShowEmailModal(false)}
                        onSuccess={handleEmailChanged}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}