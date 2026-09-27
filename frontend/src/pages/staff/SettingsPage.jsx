import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Bell, Moon, Sun, Volume2, Shield, ArrowRight, Save, RefreshCw,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/layout/PageHeader'
import { useToastStore } from '../../store/toastStore'

const STORAGE_KEY = 'uniqueue_staff_prefs'

const DEFAULTS = {
    notifyNewTicket: true,
    notifySound: false,
    autoRefresh: true,
    compactMode: false,
}

function Toggle({ label, description, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
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

    // Load from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) })
        } catch {}
    }, [])

    const set = (k, v) => setPrefs((p) => ({ ...p, [k]: v }))

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
                                    How you want to be alerted when new students join your queues.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Toggle
                                label="Notify me about new tickets"
                                description="Get a toast + bell indicator when someone joins a queue you serve."
                                checked={prefs.notifyNewTicket}
                                onChange={(e) => set('notifyNewTicket', e.target.checked)}
                            />
                            <Toggle
                                label="Play sound on new ticket"
                                description="Chime when a student joins. Useful if you're away from the screen."
                                checked={prefs.notifySound}
                                onChange={(e) => set('notifySound', e.target.checked)}
                            />
                            <Toggle
                                label="Auto-refresh queue list"
                                description="Keep the waiting list up to date without manual refresh."
                                checked={prefs.autoRefresh}
                                onChange={(e) => set('autoRefresh', e.target.checked)}
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
                                onChange={(e) => set('compactMode', e.target.checked)}
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

                {/* Actions */}
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