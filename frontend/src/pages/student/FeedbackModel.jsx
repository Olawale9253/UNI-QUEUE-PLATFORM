import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X as CloseIcon, MessageSquare } from 'lucide-react'
import api from '../../api/axios'
import Button from '../ui/Button'
import { useToastStore } from '../../store/toastStore'

const RATING_LABELS = {
    1: 'Very poor',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
}

export default function FeedbackModal({ ticket, open, onClose, onSubmitted }) {
    const { push } = useToastStore()
    const [rating, setRating] = useState(0)
    const [hover, setHover] = useState(0)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (!ticket) return null

    const handleSubmit = async () => {
        if (rating < 1) {
            push({ type: 'error', message: 'Please pick a rating (1–5 stars)' })
            return
        }
        setSubmitting(true)
        try {
            await api.post('/api/user/feedback', {
                ticketId: ticket.id,
                rating,
                comment: comment.trim() || null,
            })
            push({ type: 'success', message: 'Thanks for your feedback' })
            setRating(0)
            setComment('')
            onSubmitted?.()
            onClose?.()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to submit' })
        } finally {
            setSubmitting(false)
        }
    }

    const active = hover || rating

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => !submitting && onClose?.()}
                        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(event) => event.stopPropagation()}
                            className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                        >
                            <button
                                onClick={() => !submitting && onClose?.()}
                                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Close"
                            >
                                <CloseIcon className="h-4 w-4" />
                            </button>

                            <h2 className="text-lg font-semibold text-slate-900">
                                How was your experience?
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Ticket <span className="font-mono font-medium">{ticket.ticketNumber}</span>
                                {ticket.queueName ? ` · ${ticket.queueName}` : ''}
                            </p>

                            {/* Star picker */}
                            <div className="mt-6 flex flex-col items-center">
                                <div
                                    className="flex gap-1"
                                    onMouseLeave={() => setHover(0)}
                                >
                                    {[1, 2, 3, 4, 5].map((count) => (
                                        <button
                                            key={count}
                                            type="button"
                                            onClick={() => setRating(count)}
                                            onMouseEnter={() => setHover(count)}
                                            className="rounded-lg p-1 transition-transform hover:scale-110"
                                            aria-label={`${count} star${count > 1 ? 's' : ''}`}
                                        >
                                            <Star
                                                className={`h-9 w-9 transition-colors ${
                                                    count <= active
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'text-slate-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 h-5 text-sm font-medium text-slate-700">
                                    {active > 0 ? RATING_LABELS[active] : '\u00A0'}
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="mt-5">
                                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Comments{' '}
                                    <span className="text-xs font-normal text-slate-500">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={comment}
                                    onChange={(eventValue) => setComment(eventValue.target.value)}
                                    placeholder="Tell us what went well or what could be improved…"
                                    maxLength={2000}
                                    className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                                />
                            </div>

                            {/* Actions */}
                            <div className="mt-6 flex justify-end gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => !submitting && onClose?.()}
                                    disabled={submitting}
                                >
                                    Skip
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSubmit}
                                    loading={submitting}
                                    disabled={submitting || rating < 1}
                                >
                                    Submit feedback
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}