import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    X as CloseIcon, Star, Loader2, AlertCircle, CheckCircle2, MessageSquare,
} from 'lucide-react'
import api from '../../api/axios'
import Button from '../ui/Button'
import { useToastStore } from '../../store/toastStore'

export default function RatingModal({ ticket, onClose, onRated }) {
    const { push } = useToastStore()
    const [rating, setRating] = useState(0)
    const [hovered, setHovered] = useState(0)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const submit = async (event) => {
        event.preventDefault()
        if (rating < 1) {
            setError('Please pick a star rating')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            await api.post('/api/user/feedback', {
                ticketId: ticket.id,
                rating,
                comment: comment.trim() || null,
            })
            setSuccess(true)
            push({ type: 'success', message: 'Thanks for your feedback!' })
            setTimeout(() => {
                onRated?.(ticket.id, rating)
            }, 1000)
        } catch (err) {
            const msg = err.message || 'Failed to submit feedback'
            // If it's a duplicate, still mark as rated and close
            if (msg.toLowerCase().includes('already')) {
                push({ type: 'info', message: 'You already rated this ticket' })
                onRated?.(ticket.id, rating || null)
                return
            }
            setError(msg)
        } finally {
            setSubmitting(false)
        }
    }

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !submitting && onClose()}
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.2 }}
                    onClick={(eventValue) => eventValue.stopPropagation()}
                    className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                    <button
                        onClick={() => !submitting && onClose()}
                        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>

                    {/* ═══ SUCCESS STATE ═══ */}
                    {success ? (
                        <div className="py-6 text-center">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40"
                            >
                                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </motion.div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Thanks for your feedback!
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                It helps us improve service quality.
                            </p>
                        </div>
                    ) : (
                        /* ═══ FORM STATE ═══ */
                        <form onSubmit={submit}>
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    How was your service?
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {ticket.queueName || ticket.officeName || 'Service'}
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">
                                    Ticket {ticket.ticketNumber}
                                </p>
                            </div>

                            {/* Star rating */}
                            <div className="mb-5">
                                <div className="flex justify-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((count) => {
                                        const isActive = (hovered || rating) >= count
                                        return (
                                            <button
                                                key={count}
                                                type="button"
                                                onClick={() => setRating(count)}
                                                onMouseEnter={() => setHovered(count)}
                                                onMouseLeave={() => setHovered(0)}
                                                disabled={submitting}
                                                className="transition-transform hover:scale-110 focus:outline-none disabled:opacity-60"
                                                aria-label={`${count} star${count === 1 ? '' : 's'}`}
                                            >
                                                <Star
                                                    className={`h-10 w-10 transition-colors ${
                                                        isActive
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'fill-transparent text-slate-300 dark:text-slate-600'
                                                    }`}
                                                />
                                            </button>
                                        )
                                    })}
                                </div>
                                <div className="mt-2 h-5 text-center text-sm font-medium">
                                    {rating > 0 ? (
                                        <span className="text-amber-600 dark:text-amber-400">
                      {ratingLabels[rating]}
                    </span>
                                    ) : (
                                        <span className="text-slate-400 dark:text-slate-500">
                      Tap to rate
                    </span>
                                    )}
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="mb-4">
                                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                                    Anything else to share?{' '}
                                    <span className="font-normal text-slate-400">(optional)</span>
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(eventValue2) => setComment(eventValue2.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    disabled={submitting}
                                    placeholder="Tell us more about your experience…"
                                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                                />
                                <p className="mt-1 text-right text-[10px] text-slate-400">
                                    {comment.length}/500
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    loading={submitting}
                                    disabled={submitting || rating < 1}
                                >
                                    {submitting ? 'Submitting…' : 'Submit feedback'}
                                </Button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </>
    )
}