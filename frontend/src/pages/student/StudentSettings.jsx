import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    User, Mail, Phone, Building2, GraduationCap, Lock, Bell, Volume2,
    Palette, LogOut, AlertTriangle, Loader2, Save, ShieldCheck,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ThemeToggle from '../../components/ui/ThemeToggle'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { usePrefsStore } from '../../store/prefsStore'
import ChangeEmailModal from '../../components/student/ChangeEmailModal'
import { useWebPush } from '../../hooks/useWebPush'

/* ------------------------------------------------------------------ */
/*  Layout primitives                                                  */
/* ------------------------------------------------------------------ */

function SettingsPage({ children }) {
    return (
        <div className="mx-auto w-full max-w-3xl space-y-6">
            {children}
        </div>
    )
}

function PageHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Settings
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage your profile, security, and preferences.
            </p>
        </motion.div>
    )
}

function SectionCard({ icon: Icon, title, description, danger = false, children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card
                padded={false}
                className={
                    danger
                        ? 'border-rose-200 dark:border-rose-900/60'
                        : undefined
                }
            >
                <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
                    <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            danger
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                        }`}
                    >
                        <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                        <h2
                            className={`text-[15px] font-semibold leading-tight ${
                                danger
                                    ? 'text-rose-900 dark:text-rose-200'
                                    : 'text-slate-900 dark:text-slate-100'
                            }`}
                        >
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="px-5 py-5 sm:px-6">{children}</div>
            </Card>
        </motion.div>
    )
}

function Field({ label, icon: Icon, hint, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </label>
            {children}
            {hint && !error && (
                <p className="text-[11px] leading-relaxed text-slate-400">{hint}</p>
            )}
            {error && (
                <p className="text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
                    {error}
                </p>
            )}
        </div>
    )
}

function TextInput({ value, onChange, type = 'text', placeholder, disabled }) {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-brand-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
        />
    )
}

function Toggle({ checked, onChange, disabled, busy }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled || busy}
            onClick={() => !disabled && !busy && onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                checked
                    ? 'bg-brand-600 hover:bg-brand-700'
                    : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600'
            }`}
        >
            <span
                className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow transition-transform duration-200 ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            >
                {busy && <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-500" />}
            </span>
        </button>
    )
}

function ActionBar({ children }) {
    return (
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            {children}
        </div>
    )
}

function SettingRow({ icon: Icon, title, hint, control }) {
    return (
        <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-1 items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {title}
                    </div>
                    {hint && (
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {hint}
                        </div>
                    )}
                </div>
            </div>
            <div className="shrink-0">{control}</div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Profile                                                            */
/* ------------------------------------------------------------------ */

function ProfileSection({ profile, onSaved, onEmailChange }) {
    const { user, setUser } = useAuthStore()
    const { push } = useToastStore()
    const [emailModalOpen, setEmailModalOpen] = useState(false)
    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        department: '',
        matricNumber: '',
    })
    const [saving, setSaving] = useState(false)

    const isFresher = user?.role === 'FRESHER'

    useEffect(() => {
        if (!profile) return
        setForm({
            fullName: profile.fullName || '',
            phone: profile.phone || '',
            department: profile.department || '',
            matricNumber: profile.matricNumber || '',
        })
    }, [profile])

    const onChange = (key) => (event) =>
        setForm((item) => ({ ...item, [key]: event.target.value }))

    const save = async () => {
        setSaving(true)
        try {
            const payload = {
                fullName: form.fullName.trim() || undefined,
                phone: form.phone.trim() || undefined,
                department: form.department.trim() || undefined,
            }
            if (isFresher && form.matricNumber.trim()) {
                payload.matricNumber = form.matricNumber.trim()
            }

            const res = await api.put('/api/profile', payload)
            const updated = res.data?.data

            if (updated?.fullName && updated.fullName !== user?.fullName) {
                setUser({ fullName: updated.fullName })
            }
            push({ type: 'success', message: 'Profile saved' })
            onSaved?.(updated)
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to save profile',
            })
        } finally {
            setSaving(false)
        }
    }

    const hasChanges =
        form.fullName !== (profile?.fullName || '') ||
        form.phone !== (profile?.phone || '') ||
        form.department !== (profile?.department || '') ||
        (isFresher && form.matricNumber !== (profile?.matricNumber || ''))

    return (
        <SectionCard
            icon={User}
            title="Profile"
            description="Your personal information shown across the app."
        >
            <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Full name" icon={User}>
                        <TextInput
                            value={form.fullName}
                            onChange={onChange('fullName')}
                            placeholder="Your full name"
                        />
                    </Field>
                    <Field label="Phone" icon={Phone}>
                        <TextInput
                            value={form.phone}
                            onChange={onChange('phone')}
                            placeholder="+234 800 000 0000"
                        />
                    </Field>
                </div>

                <Field label="Department" icon={Building2}>
                    <TextInput
                        value={form.department}
                        onChange={onChange('department')}
                        placeholder="e.g. Computer Science"
                    />
                </Field>

                {isFresher && (
                    <Field
                        label="Matric number"
                        icon={GraduationCap}
                        hint="Enter this once you receive it — it upgrades your account to full access."
                    >
                        <TextInput
                            value={form.matricNumber}
                            onChange={onChange('matricNumber')}
                            placeholder="e.g. 2021/CS/001"
                        />
                    </Field>
                )}

                <Field label="Email" icon={Mail} hint="We'll verify the change with a code.">
                    <div className="flex items-center gap-2">
                        <TextInput value={profile?.email || ''} disabled />
                        <button
                            type="button"
                            onClick={() => setEmailModalOpen(true)}
                            className="shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-950/60"
                        >
                            Change
                        </button>
                    </div>
                </Field>
            </div>

            <ActionBar>
                <Button
                    onClick={save}
                    disabled={!hasChanges || saving}
                    loading={saving}
                    icon={Save}
                >
                    Save changes
                </Button>
            </ActionBar>

            <ChangeEmailModal
                open={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                currentEmail={profile?.email}
                onUpdated={(updated) => {
                    onSaved?.(updated)
                    onEmailChange?.(updated)
                }}
            />
        </SectionCard>
    )
}

/* ------------------------------------------------------------------ */
/*  Password                                                           */
/* ------------------------------------------------------------------ */

function PasswordSection() {
    const { updateTokens } = useAuthStore()
    const { push } = useToastStore()
    const [current, setCurrent] = useState('')
    const [next, setNext] = useState('')
    const [confirm, setConfirm] = useState('')
    const [saving, setSaving] = useState(false)

    const mismatch = confirm.length > 0 && next !== confirm
    const tooShort = next.length > 0 && next.length < 8
    const canSubmit =
        current.trim() && next.trim() && confirm.trim() && !mismatch && !tooShort

    const save = async () => {
        if (mismatch) {
            push({ type: 'error', message: "New passwords don't match" })
            return
        }
        if (tooShort) {
            push({ type: 'error', message: 'Password must be at least 8 characters' })
            return
        }
        setSaving(true)
        try {
            const res = await api.put('/api/profile/password', {
                currentPassword: current,
                newPassword: next,
            })
            const dateValue = res.data?.data
            if (dateValue?.accessToken) updateTokens(dateValue.accessToken, dateValue.refreshToken)
            push({ type: 'success', message: 'Password changed' })
            setCurrent('')
            setNext('')
            setConfirm('')
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to change password',
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <SectionCard
            icon={Lock}
            title="Password"
            description="Changing your password signs out every other device."
        >
            <div className="space-y-5">
                <Field label="Current password">
                    <TextInput
                        type="password"
                        value={current}
                        onChange={(event) => setCurrent(event.target.value)}
                        placeholder="Enter your current password"
                    />
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field
                        label="New password"
                        hint={tooShort ? undefined : 'At least 8 characters'}
                        error={tooShort ? 'Password must be at least 8 characters' : null}
                    >
                        <TextInput
                            type="password"
                            value={next}
                            onChange={(eventValue) => setNext(eventValue.target.value)}
                            placeholder="Enter new password"
                        />
                    </Field>
                    <Field
                        label="Confirm new password"
                        error={mismatch ? "Passwords don't match" : null}
                    >
                        <TextInput
                            type="password"
                            value={confirm}
                            onChange={(eventValue2) => setConfirm(eventValue2.target.value)}
                            placeholder="Re-enter new password"
                        />
                    </Field>
                </div>
            </div>

            <ActionBar>
                <Button
                    onClick={save}
                    disabled={!canSubmit || saving}
                    loading={saving}
                    icon={ShieldCheck}
                >
                    Update password
                </Button>
            </ActionBar>
        </SectionCard>
    )
}

/* ------------------------------------------------------------------ */
/*  Notifications — server-backed                                      */
/* ------------------------------------------------------------------ */

function NotificationsSection() {
    const { push } = useToastStore()
    const webPush = useWebPush()
    const prefs = usePrefsStore((item) => item.prefs)
    const updatePrefs = usePrefsStore((itemValue) => itemValue.update)
    const [busy, setBusy] = useState(false)

    const toggleSound = async (on) => {
        const res = await updatePrefs({ soundEnabled: on })
        if (res.success) {
            push({ type: 'success', message: on ? 'Sound on' : 'Sound muted' })
        } else {
            push({ type: 'error', message: res.error })
        }
    }

    const toggleTicketEmails = async (on) => {
        const res = await updatePrefs({ ticketEmailsEnabled: on })
        if (res.success) {
            push({
                type: 'success',
                message: on ? 'Email notifications on' : 'Email notifications off',
            })
        } else {
            push({ type: 'error', message: res.error })
        }
    }

    const togglePush = async (on) => {
        if (busy) return
        setBusy(true)
        try {
            if (on) {
                const result = await webPush.subscribe()
                if (result === 'granted') {
                    await updatePrefs({ pushEnabled: true })
                    push({ type: 'success', message: 'Push notifications enabled' })
                } else if (result === 'denied') {
                    push({
                        type: 'error',
                        message:
                            'Permission denied. Enable notifications in your browser settings.',
                    })
                } else {
                    push({
                        type: 'warning',
                        message: 'Could not enable push on this device',
                    })
                }
            } else {
                const reg = await navigator.serviceWorker.getRegistration('/sw.js')
                const sub = reg ? await reg.pushManager.getSubscription() : null
                if (sub) {
                    try {
                        await api.post('/api/push/unsubscribe', {
                            endpoint: sub.endpoint,
                        })
                    } catch {
                        // best-effort
                    }
                    await sub.unsubscribe()
                }
                await updatePrefs({ pushEnabled: false })
                push({ type: 'success', message: 'Push notifications off' })
            }
        } catch (err) {
            push({
                type: 'error',
                message: err?.message || 'Failed to update push settings',
            })
        } finally {
            setBusy(false)
        }
    }

    const pushEnabled = !!webPush.subscription && prefs.pushEnabled !== false
    const pushSupported = webPush.supported
    const pushDenied = webPush.permission === 'denied'

    const pushHint = (() => {
        if (!pushSupported) return 'Not supported on this device'
        if (pushDenied) return 'Blocked in browser — enable in your site settings'
        if (pushEnabled) return 'Enabled on this device'
        return 'Get alerted even when the app is closed'
    })()

    return (
        <SectionCard
            icon={Bell}
            title="Notifications"
            description="Control how you get alerted about your queue tickets."
        >
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <SettingRow
                    icon={Bell}
                    title="Push notifications"
                    hint={pushHint}
                    control={
                        <Toggle
                            checked={pushEnabled}
                            onChange={togglePush}
                            disabled={!pushSupported || pushDenied}
                            busy={busy}
                        />
                    }
                />
                <SettingRow
                    icon={Volume2}
                    title="Sound"
                    hint="Play a chime when your turn is near."
                    control={
                        <Toggle
                            checked={prefs.soundEnabled !== false}
                            onChange={toggleSound}
                        />
                    }
                />
                <SettingRow
                    icon={Mail}
                    title="Ticket emails"
                    hint="Get an email when your ticket is called or completed."
                    control={
                        <Toggle
                            checked={prefs.ticketEmailsEnabled !== false}
                            onChange={toggleTicketEmails}
                        />
                    }
                />
            </div>
        </SectionCard>
    )
}

/* ------------------------------------------------------------------ */
/*  Appearance                                                         */
/* ------------------------------------------------------------------ */

function AppearanceSection() {
    return (
        <SectionCard
            icon={Palette}
            title="Appearance"
            description="Choose how UniQueue looks on this device."
        >
            <SettingRow
                icon={Palette}
                title="Theme"
                hint="Light, dark, or follow your system preference."
                control={<ThemeToggle />}
            />
        </SectionCard>
    )
}

/* ------------------------------------------------------------------ */
/*  Account                                                            */
/* ------------------------------------------------------------------ */

function AccountSection() {
    const { user, logout } = useAuthStore()
    const [confirming, setConfirming] = useState(false)

    const doLogout = () => {
        logout()
        window.location.href = '/login'
    }

    return (
        <>
            <SectionCard
                icon={LogOut}
                title="Sign out"
                description="End your session on this device."
                danger
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Signed in as{' '}
                        <strong className="font-semibold text-slate-700 dark:text-slate-300">
                            {user?.email}
                        </strong>
                    </div>
                    <button
                        onClick={() => setConfirming(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 shadow-sm transition-colors hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </div>
            </SectionCard>

            <ConfirmDialog
                open={confirming}
                onClose={() => setConfirming(false)}
                onConfirm={doLogout}
                title="Sign out?"
                description="You'll need to log back in to access your queues and clearance."
                confirmLabel="Sign out"
                cancelLabel="Stay signed in"
                variant="danger"
            />
        </>
    )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function StudentSettings() {
    const { push } = useToastStore()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/api/profile')
            setProfile(res.data?.data || null)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load profile')
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to load profile',
            })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    if (loading) {
        return (
            <SettingsPage>
                <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-56 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            </SettingsPage>
        )
    }

    if (error) {
        return (
            <SettingsPage>
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/20">
                    <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
                    <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
                        {error}
                    </p>
                    <Button onClick={load} className="mt-4">
                        Try again
                    </Button>
                </div>
            </SettingsPage>
        )
    }

    return (
        <SettingsPage>
            <PageHeader />

            <ProfileSection
                profile={profile}
                onSaved={setProfile}
                onEmailChange={(updated) => {
                    if (updated) setProfile(updated)
                    load()
                }}
            />
            <PasswordSection />
            <NotificationsSection />
            <AppearanceSection />
            <AccountSection />
        </SettingsPage>
    )
}