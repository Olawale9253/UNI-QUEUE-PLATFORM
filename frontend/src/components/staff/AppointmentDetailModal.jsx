import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    X as CloseIcon, Calendar, Clock, User, Mail, Hash, CheckCircle2, XCircle,
    AlertCircle, MapPin, MessageSquare, Loader2,
} from 'lucide-react'
import api from '../../api/axios'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useToastStore } from '../../store/toastStore'

const STATUS_VARIANTS = {
    BOOKED: 'indigo',
    CONFIRMED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'default',
    NO_SHOW: 'danger',
}

const STATUS_LABELS = {
    BOOKED: 'Booked',
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No-show',
}

function formatDateTime(dt) {
    if (!dt) return '—'
    try {
        return new Date(dt).toLocaleString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
    } catch {
        return '—'
    }
}

function formatTimeOnly(dt) {
    if (!dt) return '—'
    try {
        return new Date(dt).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
    } catch {
        return '—'
    }
}

function generateReference(appt) {
    if (!appt) return '—'
    const dateValue = appt.bookedAt ? new Date(appt.bookedAt) : new Date()
    const yyyy = dateValue.getFullYear()
    const mm = String(dateValue.getMonth() + 1).padStart(2, '0')
    const dd = String(dateValue.getDate()).padStart(2, '0')
    const idPart = String(appt.id || 0).padStart(4, '0')
    return `APP${yyyy}${mm}${dd}${idPart}`
}

function DetailRow({ icon: Icon, label, value }) {
    if (!value) return null
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {label}
                </div>
                <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {value}
                </div>
            </div>
        </div>
    )
}

export default function AppointmentDetailModal({ appointment, onClose, onUpdated }) {
    const { push } = useToastStore()
    const [staffNotes, setStaffNotes] = useState('')
    const [acting, setActing] = useState(null)
    const [error, setError] = useState(null)
    const [confirmNoShow, setConfirmNoShow] = useState(false)

    if (!appointment) return null

    const isActionable =
        appointment.status === 'BOOKED' || appointment.status === 'CONFIRMED'
    const isCompleted = appointment.status === 'COMPLETED'
    const isNoShow = appointment.status === 'NO_SHOW'

    const complete = async () => {
        setActing('complete')
        setError(null)
        try {
            await api.post(
                `/api/staff/appointment-slots/appointments/${appointment.id}/complete`,
                { staffNotes: staffNotes.trim() || null }
            )
            push({ type: 'success', message: 'Appointment marked complete' })
            onUpdated?.()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete appointment')
        } finally {
            setActing(null)
        }
    }

    const noShow = async () => {
        setActing('no-show')
        setError(null)
        try {
            await api.post(
                `/api/staff/appointment-slots/appointments/${appointment.id}/no-show`
            )
            push({ type: 'success', message: 'Marked as no-show' })
            onUpdated?.()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark no-show')
        } finally {
            setActing(null)
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !acting && onClose()}
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2 }}
                    onClick={(event) => event.stopPropagation()}
                    className="relative my-8 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                    <button
                        onClick={() => !acting && onClose()}
                        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>

                    {/* Header */}
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 pr-8">
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {appointment.slotTitle || 'Appointment'}
                            </h3>
                            <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                                Reference: {generateReference(appointment)}
                            </p>
                        </div>
                        <Badge variant={STATUS_VARIANTS[appointment.status] || 'default'}>
                            {STATUS_LABELS[appointment.status] || appointment.status}
                        </Badge>
                    </div>

                    {/* Details grid */}
                    <div className="space-y-3">
                        <DetailRow
                            icon={User}
                            label="Student"
                            value={appointment.studentName}
                        />
                        <DetailRow
                            icon={Mail}
                            label="Email"
                            value={appointment.studentEmail}
                        />
                        {appointment.matricNumber && (
                            <DetailRow
                                icon={Hash}
                                label="Matric number"
                                value={appointment.matricNumber}
                            />
                        )}
                        <DetailRow
                            icon={Calendar}
                            label="Date"
                            value={formatDateTime(appointment.startTime)}
                        />
                        <DetailRow
                            icon={Clock}
                            label="Time slot"
                            value={`${formatTimeOnly(appointment.startTime)} – ${formatTimeOnly(appointment.endTime)}`}
                        />
                        {appointment.slotLocation && (
                            <DetailRow
                                icon={MapPin}
                                label="Location"
                                value={appointment.slotLocation}
                            />
                        )}
                    </div>

                    {/* Student's note */}
                    {appointment.notes && (
                        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                <MessageSquare className="h-3 w-3" />
                                Student's note
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                {appointment.notes}
                            </p>
                        </div>
                    )}

                    {/* Staff notes (shown for completed appointments) */}
                    {isCompleted && appointment.staffNotes && (
                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                Your notes
                            </div>
                            <p className="text-sm text-emerald-900 dark:text-emerald-200">
                                {appointment.staffNotes}
                            </p>
                        </div>
                    )}

                    {/* Actions block (only for actionable appointments) */}
                    {isActionable && (
                        <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Staff notes <span className="font-normal text-slate-400">(optional)</span>
                            </label>
                            <textarea
                                rows={3}
                                value={staffNotes}
                                onChange={(eventValue) => setStaffNotes(eventValue.target.value)}
                                disabled={!!acting}
                                placeholder="Add notes for the record — e.g. outcome of the meeting, follow-ups needed…"
                                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                            />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Footer actions */}
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-2">
                            {isActionable && !confirmNoShow && (
                                <button
                                    type="button"
                                    onClick={() => setConfirmNoShow(true)}
                                    disabled={!!acting}
                                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Mark no-show
                                </button>
                            )}
                            {confirmNoShow && (
                                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Confirm no-show?
                  </span>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmNoShow(false)}
                                        disabled={!!acting}
                                        className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={noShow}
                                        disabled={!!acting}
                                        className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                                    >
                                        {acting === 'no-show' ? 'Marking…' : 'Yes, no-show'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                disabled={!!acting}
                            >
                                Close
                            </Button>
                            {isActionable && (
                                <Button
                                    type="button"
                                    icon={CheckCircle2}
                                    onClick={complete}
                                    loading={acting === 'complete'}
                                    disabled={!!acting}
                                    className="!bg-emerald-600 hover:!bg-emerald-700"
                                >
                                    Mark complete
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Status hint */}
                    {isNoShow && (
                        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                            This appointment was marked as a no-show.
                        </p>
                    )}
                </motion.div>
            </div>
        </>
    )
}