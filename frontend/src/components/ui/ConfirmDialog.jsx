import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'
import Button from './Button'

export default function ConfirmDialog({
                                          open,
                                          onClose,
                                          onConfirm,
                                          title,
                                          description,
                                          confirmLabel = 'Confirm',
                                          cancelLabel = 'Cancel',
                                          variant = 'danger',
                                          loading = false,
                                      }) {
    // Close on Escape
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape' && open && !loading) onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open, onClose, loading])

    // Prevent scroll on open
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    const iconStyles = {
        danger: 'bg-rose-100 text-rose-600',
        warning: 'bg-amber-100 text-amber-600',
        info: 'bg-sky-100 text-sky-600',
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => !loading && onClose()}
                        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                        >
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex items-start gap-4">
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconStyles[variant]}`}
                                >
                                    <AlertTriangle className="h-5 w-5" />
                                </div>

                                <div className="flex-1 pt-0.5">
                                    <h3 className="text-base font-semibold text-slate-900">
                                        {title}
                                    </h3>
                                    {description && (
                                        <p className="mt-2 text-sm text-slate-600">{description}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    {cancelLabel}
                                </Button>
                                <Button
                                    variant={variant === 'danger' ? 'danger' : 'primary'}
                                    size="sm"
                                    onClick={onConfirm}
                                    loading={loading}
                                    disabled={loading}
                                >
                                    {confirmLabel}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}