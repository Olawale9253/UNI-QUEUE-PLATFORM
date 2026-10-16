import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Bell, Moon, Sun, Volume2, Shield, ArrowRight, Save, RefreshCw,
    Play, BellRing, CheckCircle2,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/layout/PageHeader'
import { useToastStore } from '../../store/toastStore'
import { previewSound } from '../../lib/soundService'
import { useWebPush } from '../../hooks/useWebPush'

const STORAGE_KEY = 'uniqueue_staff_prefs'

const DEFAULTS = {
    notifyNewTicket: true,
    notifySound: false,
    soundVolume: 0.5,
    autoRefresh: true,
    compactMode: false,
}

function Toggle({ label, description, checked, onChange, disabled }) {
    return (
        <label className={`flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</div>
                {description && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
                )}
            </div>
            <div className="relative shrink-0">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-brand-600 dark:bg-slate-700" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
        </label>
    )
}

export default function SettingsPage() {
    const { push } = useToastStore()
    const [prefs, setPrefs] = useState(DEFAULTS)
    const webPush = useWebPush()

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) })
        } catch {}
    }, [])

    const set = (key, value) => setPrefs((setPref) => ({ ...setPref, [key]: value }))

    const togglePush = async (event) => {
        const wantsOn = event.target.checked
        if (wantsOn) {
            const result = await webPush.subscribe()
            if (result === 'granted') {
                push({ type: 'success', message: 'Push notifications enabled' })
            } else if (result === 'denied') {
                push({ type: 'error', message: 'Notification permission denied' })
            } else if (result === 'unsupported') {
                push({ type: 'error', message: 'Your browser does not support push notifications' })
            } else {
                push({ type: 'error', message: 'Failed to enable push notifications' })
            }
        } else {
            await webPush.unsubscribe()
            push({ type: 'info', message: 'Push notifications disabled' })
        }
    }

    const testSound = () => {
        previewSound(prefs.soundVolume)
    }

    const save = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
            push({ type: 'success', message: 'Preferences saved' })
        } catch {
            push({ type: 'error', message: 'Failed to save preferences' })
        }
    }

    const reset = () => {
        setPrefs(DEFAULTS)
        try { localStorage.removeItem(STORAGE_KEY) } catch {}
        push({ type: 'info', message: 'Preferences reset' })
    }

    const pushDescription = (() => {
        if (!webPush.supported) return 'Your browser does not support push notifications.'
        if (webPush.permission === 'denied') return 'Blocked. Enable notifications in your browser settings and reload.'
        if (webPush.subscription) return 'Active. You will get system notifications even when this tab is closed.'
        return 'Allow your phone or desktop to alert you when something happens.'
    })()

    return (
        <>
            <PageHeader
                title="Settings"
                description="Personal preferences for your staff workspace."
            />

            <div className="space-y-6">
                {/* Notifications */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
                                <Bell className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Notifications
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    How you want to be alerted when new students join.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Toggle
                                label="In-app toasts"
                                description="Show a message in the corner of the screen when something happens."
                                checked={prefs.notifyNewTicket}
                                onChange={(eventValue) => set('notifyNewTicket', eventValue.target.checked)}
                            />

                            {/* Sound — wrapped in <label> so the whole row is clickable */}
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700">
                                <label className="flex cursor-pointer items-start justify-between gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            Sound alerts
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            Play a chime when a new ticket arrives. Works even when you're on another tab.
                                        </p>
                                    </div>
                                    <div className="relative shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={prefs.notifySound}
                                            onChange={(eventValue2) => {
                                                const on = eventValue2.target.checked
                                                set('notifySound', on)
                                                if (on) setTimeout(() => previewSound(prefs.soundVolume), 100)
                                            }}
                                            className="peer sr-only"
                                        />
                                        <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-brand-600 dark:bg-slate-700" />
                                        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                                    </div>
                                </label>

                                {prefs.notifySound && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-3 border-t border-slate-100 px-4 pb-4 pt-4 dark:border-slate-800"
                                    >
                                        <Volume2 className="h-4 w-4 shrink-0 text-slate-400" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={prefs.soundVolume}
                                            onChange={(eventValue3) => set('soundVolume', parseFloat(eventValue3.target.value))}
                                            onMouseUp={testSound}
                                            onTouchEnd={testSound}
                                            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 dark:bg-slate-700"
                                        />
                                        <span className="w-10 shrink-0 text-right text-xs font-mono text-slate-500 dark:text-slate-400">
                                            {Math.round(prefs.soundVolume * 100)}%
                                        </span>
                                        <button
                                            type="button"
                                            onClick={testSound}
                                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                        >
                                            <Play className="h-3 w-3" />
                                            Test
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Push — wrapped in <label> so the whole row is clickable */}
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700">
                                <label className={`flex items-start justify-between gap-4 p-4 transition-colors ${
                                    !webPush.supported || webPush.permission === 'denied' || webPush.busy
                                        ? 'opacity-60'
                                        : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <BellRing className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                Push notifications
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            {pushDescription}
                                        </p>
                                        {webPush.subscription && (
                                            <div className="mt-2 flex items-center gap-3">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Subscribed
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(eventValue4) => {
                                                        eventValue4.preventDefault()
                                                        eventValue4.stopPropagation()
                                                        webPush.sendTest()
                                                            .then(() => push({ type: 'success', message: 'Test notification sent. Check your device.' }))
                                                            .catch(() => push({ type: 'error', message: 'Failed to send test push' }))
                                                    }}
                                                    className="text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
                                                >
                                                    Send test
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={!!webPush.subscription}
                                            onChange={togglePush}
                                            disabled={
                                                !webPush.supported
                                                || webPush.permission === 'denied'
                                                || webPush.busy
                                            }
                                            className="peer sr-only"
                                        />
                                        <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-brand-600 peer-disabled:opacity-40 dark:bg-slate-700" />
                                        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                                    </div>
                                </label>
                            </div>

                            <Toggle
                                label="Auto-refresh queue list"
                                description="Keep the waiting list up to date without manual refresh."
                                checked={prefs.autoRefresh}
                                onChange={(eventValue5) => set('autoRefresh', eventValue5.target.checked)}
                            />
                        </div>
                    </Card>
                </motion.div>

                {/* Display */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card>
                        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40">
                                <Moon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Display
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    How the workspace looks and behaves.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Toggle
                                label="Compact mode"
                                description="Reduce spacing so more items fit on screen."
                                checked={prefs.compactMode}
                                onChange={(eventValue6) => set('compactMode', eventValue6.target.checked)}
                            />
                        </div>

                        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                            <div className="flex items-start gap-3">
                                <Sun className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                    <p className="font-medium text-slate-900 dark:text-slate-100">Dark mode</p>
                                    <p className="mt-0.5">Toggle using the sun/moon icon in the top-right of the navbar.</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Account */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Account
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Manage your profile and login.
                                </p>
                            </div>
                        </div>

                        <Link
                            to="/staff/profile"
                            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                        >
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    Profile & password
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Update your name, phone, and password
                                </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                        </Link>
                    </Card>
                </motion.div>

                <div className="flex items-center justify-end gap-3">
                    <Button variant="secondary" icon={RefreshCw} onClick={reset}>
                        Reset
                    </Button>
                    <Button icon={Save} onClick={save}>
                        Save preferences
                    </Button>
                </div>
            </div>
        </>
    )
}