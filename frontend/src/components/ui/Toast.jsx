import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'
import { toastSlide } from '../../lib/motion'

const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
}

const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
}

const progressColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-sky-500',
    warning: 'bg-amber-500',
}

export default function ToastContainer() {
    const { toasts, dismiss } = useToastStore()

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {toasts.map((t) => {
                    const Icon = icons[t.type] || Info
                    return (
                        <motion.div
                            key={t.id}
                            variants={toastSlide}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            layout
                            className={`pointer-events-auto relative w-80 overflow-hidden rounded-lg border shadow-lg ${styles[t.type]}`}
                        >
                            <div className="flex items-start gap-3 px-4 py-3">
                                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                                <div className="flex-1 text-sm">{t.message}</div>
                                <button
                                    onClick={() => dismiss(t.id)}
                                    className="text-current opacity-60 transition-opacity hover:opacity-100"
                                    aria-label="Dismiss"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Progress bar */}
                            <motion.div
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: 0 }}
                                transition={{ duration: (t.duration || 4000) / 1000, ease: 'linear' }}
                                className={`h-0.5 origin-left ${progressColors[t.type]}`}
                            />
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}