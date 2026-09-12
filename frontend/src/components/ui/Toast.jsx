import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'
import { toastSlide } from '../../lib/motion'

export default function ToastContainer() {
    const { toasts, dismiss } = useToastStore()

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
                            className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${styles[t.type]}`}
                        >
                            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="flex-1 text-sm">{t.message}</div>
                            <button
                                onClick={() => dismiss(t.id)}
                                className="text-current opacity-60 transition-opacity hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}