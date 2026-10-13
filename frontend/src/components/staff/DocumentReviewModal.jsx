import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    X as CloseIcon,
    FileText,
    Download,
    Eye,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    User,
} from 'lucide-react'
import api from '../../api/axios'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useToastStore } from '../../store/toastStore'

function formatSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateTime(dt) {
    if (!dt) return '—'
    try {
        return new Date(dt).toLocaleString([], {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return '—'
    }
}

export default function DocumentReviewModal({ document: doc, onClose, onReviewed }) {
    const { push } = useToastStore()
    const [acting, setActing] = useState(null)
    const [notes, setNotes] = useState('')
    const [error, setError] = useState(null)

    if (!doc) return null

    const approve = async () => {
        setActing('approve')
        setError(null)
        try {
            await api.post(`/api/staff/documents/${doc.id}/approve`, {
                notes: notes.trim() || null,
            })
            push({ type: 'success', message: 'Document approved' })
            onReviewed?.()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve')
        } finally {
            setActing(null)
        }
    }

    const reject = async () => {
        if (!notes.trim()) {
            setError('Please add a reason for rejecting this document')
            return
        }
        setActing('reject')
        setError(null)
        try {
            await api.post(`/api/staff/documents/${doc.id}/reject`, {
                notes: notes.trim(),
            })
            push({ type: 'success', message: 'Document rejected' })
            onReviewed?.()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject')
        } finally {
            setActing(null)
        }
    }

    const preview = async () => {
        // Open tab SYNCHRONOUSLY, before any await — otherwise popup blocker kills it
        const tab = window.open('', '_blank', 'noopener,noreferrer')
        if (tab) {
            tab.document.write(
                '<p style="font-family:sans-serif;padding:24px;color:#64748b">Loading preview…</p>'
            )
        }
        try {
            const res = await api.get(`/api/documents/${doc.id}/download`, {
                params: { inline: true },
                responseType: 'blob',
            })
            const blobUrl = URL.createObjectURL(res.data)
            if (tab) {
                tab.location.href = blobUrl
            } else {
                const documentValue = document.createElement('a')
                documentValue.href = blobUrl
                documentValue.target = '_blank'
                documentValue.rel = 'noopener noreferrer'
                document.body.appendChild(documentValue)
                documentValue.click()
                documentValue.remove()
            }
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
        } catch {
            if (tab) tab.close()
            push({ type: 'error', message: 'Preview failed' })
        }
    }

    const download = async () => {
        try {
            const res = await api.get(`/api/documents/${doc.id}/download`, {
                responseType: 'blob',
            })
            const blobUrl = URL.createObjectURL(res.data)
            const documentValue = document.createElement('a')
            documentValue.href = blobUrl
            documentValue.download = doc.originalFilename || 'document'
            document.body.appendChild(documentValue)
            documentValue.click()
            documentValue.remove()
            URL.revokeObjectURL(blobUrl)
        } catch {
            push({ type: 'error', message: 'Download failed' })
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
                        type="button"
                        onClick={() => !acting && onClose()}
                        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>

                    {/* Header */}
                    <div className="mb-5 flex items-start gap-3 pr-8">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                            <FileText className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {doc.originalFilename}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {doc.type} · {formatSize(doc.sizeBytes)}
                            </p>
                        </div>
                        <Badge variant="warning">Pending</Badge>
                    </div>

                    {/* Details */}
                    <div className="mb-5 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                    Student
                                </div>
                                <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {doc.uploadedByName || '—'}
                                </div>
                            </div>
                        </div>

                        {doc.ticketNumber && (
                            <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                                <div>
                                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                        Linked ticket
                                    </div>
                                    <div className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {doc.ticketNumber}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                            <div>
                                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                    Uploaded
                                </div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {formatDateTime(doc.createdAt)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview + Download */}
                    <div className="mb-5 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={preview}
                            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <Eye className="h-4 w-4" />
                            Preview
                        </button>
                        <button
                            type="button"
                            onClick={download}
                            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </button>
                    </div>

                    {/* Notes */}
                    <div className="mb-5">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Review notes{' '}
                            <span className="font-normal text-slate-400">
                                (required for rejection)
                            </span>
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(eventValue) => setNotes(eventValue.target.value)}
                            disabled={!!acting}
                            placeholder="Add comments or the reason for rejection…"
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                    </div>

                    {error && (
                        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={reject}
                            disabled={!!acting}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                        >
                            <XCircle className="h-4 w-4" />
                            {acting === 'reject' ? 'Rejecting…' : 'Reject'}
                        </button>
                        <Button
                            type="button"
                            icon={CheckCircle2}
                            onClick={approve}
                            loading={acting === 'approve'}
                            disabled={!!acting}
                            className="!bg-emerald-600 hover:!bg-emerald-700"
                        >
                            Approve
                        </Button>
                    </div>
                </motion.div>

            </div>
        </>
    )
}