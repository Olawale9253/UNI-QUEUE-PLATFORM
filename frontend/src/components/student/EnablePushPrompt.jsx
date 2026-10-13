import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X as CloseIcon, CheckCircle2, Loader2 } from 'lucide-react'
import { useWebPush } from '../../hooks/useWebPush'
import { useToastStore } from '../../store/toastStore'

const DISMISS_KEY = 'uniqueue_push_prompt_dismissed'

/**
 * A slim, dismissible prompt that nudges the student to enable push
 * notifications. Only shows when:
 *   - Push is supported by the browser
 *   - Permission isn't already denied
 *   - Student doesn't already have an active subscription
 *   - Student hasn't dismissed it in this browser
 *
 * Once enabled or dismissed, it disappears permanently (for this browser).
 */
export default function EnablePushPrompt({ className = '' }) {
    const webPush = useWebPush()
    const { push } = useToastStore()
    const [dismissed, setDismissed] = useState(true)   // default hidden to avoid flash
    const [enabling, setEnabling] = useState(false)

    useEffect(() => {
        try {
            const flag = localStorage.getItem(DISMISS_KEY)
            setDismissed(flag === '1')
        } catch {
            setDismissed(false)
        }
    }, [])

    const handleEnable = async () => {
        setEnabling(true)
        try {
            const result = await webPush.subscribe()
            if (result === 'granted') {
                push({ type: 'success', message: 'Push notifications enabled' })
                try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
                setDismissed(true)
            } else if (result === 'denied') {
                push({ type: 'error', message: 'Permission denied. Enable notifications in your browser settings.' })
                try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
                setDismissed(true)
            } else {
                push({ type: 'error', message: 'Could not enable notifications on this device' })
            }
        } finally {
            setEnabling(false)
        }
    }

    const handleDismiss = () => {
        try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
        setDismissed(true)
    }

    // Hide entirely if any condition means the prompt is not useful
    if (dismissed) return null
    if (!webPush.supported) return null
    if (webPush.permission === 'denied') return null
    if (webPush.subscription) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`${className} relative overflow-hidden rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 via-brand-50 to-white p-4 dark:border-brand-900 dark:from-brand-950/40 dark:via-brand-950/30 dark:to-slate-900`}
            >
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 shadow-sm shadow-brand-600/30">
                        <Bell className="h-5 w-5 text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Get notified when it's your turn
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                            Turn on notifications so we can alert you even when the app is closed.
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleEnable}
                                disabled={enabling}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                            >
                                {enabling ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Enabling…
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Enable notifications
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleDismiss}
                                disabled={enabling}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white/60 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800/60"
                            >
                                Not now
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleDismiss}
                        disabled={enabling}
                        aria-label="Dismiss"
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800/60"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}