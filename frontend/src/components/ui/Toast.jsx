import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

/* ------------------------------------------------------------------ */
/* Imperative API — callable from anywhere (event handlers, non-React) */
/* ------------------------------------------------------------------ */

export const toast = {
    success: (message, opts = {}) =>
        useToastStore.getState().push({ type: 'success', message, ...opts }),
    error: (message, opts = {}) =>
        useToastStore.getState().push({ type: 'error', message, ...opts }),
    warning: (message, opts = {}) =>
        useToastStore.getState().push({ type: 'warning', message, ...opts }),
    info: (message, opts = {}) =>
        useToastStore.getState().push({ type: 'info', message, ...opts }),
    dismiss: (id) => useToastStore.getState().dismiss(id),
}

/* ------------------------------------------------------------------ */
/* Visual config                                                       */
/* ------------------------------------------------------------------ */

const ICONS = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
}

const STYLES = {
    success: { wrap: 'border-emerald-200 bg-emerald-50 text-emerald-800', bar: 'bg-emerald-500' },
    error:   { wrap: 'border-rose-200 bg-rose-50 text-rose-800',          bar: 'bg-rose-500' },
    info:    { wrap: 'border-sky-200 bg-sky-50 text-sky-800',             bar: 'bg-sky-500' },
    warning: { wrap: 'border-amber-200 bg-amber-50 text-amber-800',       bar: 'bg-amber-500' },
}

const ENTER = { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
const EXIT  = { duration: 0.22, ease: [0.4, 0, 1, 1] }

/* ------------------------------------------------------------------ */
/* Single toast                                                        */
/* ------------------------------------------------------------------ */

function ToastItem({ toast: t, onDismiss }) {
    const Icon = ICONS[t.type] ?? Info
    const s = STYLES[t.type] ?? STYLES.info

    return (
        <motion.div
            layout="position"
            initial={{ opacity: 0, x: 360, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1, transition: ENTER }}
            exit={{ opacity: 0, x: 360, scale: 0.96, transition: EXIT }}
            style={{ willChange: 'transform, opacity' }}
            className={`pointer-events-auto relative w-80 overflow-hidden rounded-xl border shadow-lg ${s.wrap}`}
        >
            <div className="flex items-start gap-3 px-4 py-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
                <div className="min-w-0 flex-1 text-sm leading-snug">{t.message}</div>
                <button
                    onClick={() => onDismiss(t.id)}
                    className="-mr-1 -mt-1 rounded-md p-1 text-current opacity-50 transition-opacity hover:opacity-100"
                    aria-label="Dismiss"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* auto-dismiss progress bar */}
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (t.duration ?? 4000) / 1000, ease: 'linear' }}
                className={`h-0.5 origin-left ${s.bar}`}
            />
        </motion.div>
    )
}

/* ------------------------------------------------------------------ */
/* Container — mount once in App.jsx                                   */
/* ------------------------------------------------------------------ */

export default function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts)
    const dismiss = useToastStore((s) => s.dismiss)

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col items-end gap-2">
            <AnimatePresence initial={false}>
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </AnimatePresence>
        </div>
    )
}