import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Upload, FileText, Trash2, Download, AlertCircle,
    CheckCircle2, Clock, XCircle, Filter,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

const DOC_TYPES = [
    { value: 'PAYMENT_PROOF', label: 'Payment proof' },
    { value: 'TRANSCRIPT', label: 'Transcript' },
    { value: 'ID_CARD', label: 'ID card' },
    { value: 'ADMISSION_LETTER', label: 'Admission letter' },
    { value: 'MEDICAL_REPORT', label: 'Medical report' },
    { value: 'CERTIFICATE', label: 'Certificate' },
    { value: 'OTHER', label: 'Other' },
]

const STATUS_VARIANTS = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
}

const STATUS_LABELS = {
    PENDING: 'Pending review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
}

const STATUS_ICONS = {
    PENDING: Clock,
    APPROVED: CheckCircle2,
    REJECTED: XCircle,
}

const FILTERS = [
    { value: 'ALL', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
]

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

export default function DocumentsTab() {
    const { push } = useToastStore()
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [uploadOpen, setUploadOpen] = useState(false)
    const [filter, setFilter] = useState('ALL')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const [type, setType] = useState('OTHER')
    const [file, setFile] = useState(null)
    const fileInputRef = useRef(null)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/user/documents')
            setDocs(res.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load documents' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 10000, slowMs: 30000 })

    const upload = async (e) => {
        e.preventDefault()
        if (!file) {
            push({ type: 'error', message: 'Select a file first' })
            return
        }
        setUploading(true)
        try {
            const form = new FormData()
            form.append('file', file)
            form.append('type', type)
            await api.post('/api/user/documents', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            push({ type: 'success', message: 'Document uploaded' })
            setFile(null)
            setType('OTHER')
            if (fileInputRef.current) fileInputRef.current.value = ''
            setUploadOpen(false)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Upload failed' })
        } finally {
            setUploading(false)
        }
    }

    const destroy = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/user/documents/${deleteTarget.id}`)
            push({ type: 'success', message: 'Document deleted' })
            setDeleteTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to delete' })
        } finally {
            setDeleting(false)
        }
    }

    const download = async (doc) => {
        try {
            const res = await api.get(`/api/documents/${doc.id}/download`, {
                responseType: 'blob',
            })
            const blobUrl = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = doc.originalFilename || 'document'
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(blobUrl)
        } catch {
            push({ type: 'error', message: 'Download failed' })
        }
    }

    const filtered = useMemo(() => {
        if (filter === 'ALL') return docs
        return docs.filter((d) => d.status === filter)
    }, [docs, filter])

    const counts = useMemo(() => ({
        ALL: docs.length,
        PENDING: docs.filter((d) => d.status === 'PENDING').length,
        APPROVED: docs.filter((d) => d.status === 'APPROVED').length,
        REJECTED: docs.filter((d) => d.status === 'REJECTED').length,
    }), [docs])

    if (loading) {
        return (
            <div>
                <div className="mb-5">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Documents</h2>
                </div>
                <Card padded={false}>
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                </Card>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Documents
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Upload documents for staff review. You'll be notified when they're approved or rejected.
                    </p>
                </div>
                <Button
                    icon={Upload}
                    onClick={() => setUploadOpen((v) => !v)}
                    variant={uploadOpen ? 'secondary' : 'primary'}
                >
                    {uploadOpen ? 'Cancel' : 'Upload document'}
                </Button>
            </div>

            <AnimatePresence>
                {uploadOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-5 overflow-hidden"
                    >
                        <Card>
                            <form onSubmit={upload} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Document type
                                        </label>
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            {DOC_TYPES.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            File
                                        </label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:text-slate-400 dark:file:bg-brand-950/40 dark:file:text-brand-300"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="secondary" onClick={() => setUploadOpen(false)} disabled={uploading}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={uploading} disabled={uploading || !file}>
                                        {uploading ? 'Uploading…' : 'Upload'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {docs.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-1.5">
                    {FILTERS.map((f) => {
                        const isActive = filter === f.value
                        return (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setFilter(f.value)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                    isActive
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                }`}
                            >
                                {f.label}
                                <span className={`text-[10px] font-bold ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                  {counts[f.value] ?? 0}
                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            {docs.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No documents yet"
                    description="Upload your first document — staff will review it shortly."
                    action={<Button icon={Upload} onClick={() => setUploadOpen(true)}>Upload document</Button>}
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Filter}
                    title={`No ${filter.toLowerCase()} documents`}
                    description="Try a different filter."
                    action={<Button variant="secondary" onClick={() => setFilter('ALL')}>Show all</Button>}
                />
            ) : (
                <div className="space-y-3">
                    {filtered.map((d, idx) => {
                        const StatusIcon = STATUS_ICONS[d.status] || Clock
                        return (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                            >
                                <Card>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 flex-1 items-start gap-4">
                                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                                d.status === 'APPROVED'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                    : d.status === 'REJECTED'
                                                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                            }`}>
                                                <StatusIcon className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                                                        {d.originalFilename}
                                                    </h3>
                                                    <Badge variant={STATUS_VARIANTS[d.status] || 'default'}>
                                                        {STATUS_LABELS[d.status] || d.status}
                                                    </Badge>
                                                </div>

                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <span>{DOC_TYPES.find((t) => t.value === d.type)?.label || d.type}</span>
                                                    <span>·</span>
                                                    <span>{formatSize(d.sizeBytes)}</span>
                                                    <span>·</span>
                                                    <span>Uploaded {formatDateTime(d.createdAt)}</span>
                                                </div>

                                                {d.status === 'REJECTED' && d.reviewNotes && (
                                                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                        <div>
                                                            <span className="font-semibold">Reason: </span>
                                                            {d.reviewNotes}
                                                            {d.reviewedByName && (
                                                                <div className="mt-0.5 text-[10px] opacity-70">
                                                                    — {d.reviewedByName}, {formatDateTime(d.reviewedAt)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {d.status === 'APPROVED' && d.reviewedByName && (
                                                    <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                                                        Approved by {d.reviewedByName} · {formatDateTime(d.reviewedAt)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1 sm:flex-col sm:items-end">
                                            <button
                                                onClick={() => download(d)}
                                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                                title="Download"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            {d.status !== 'APPROVED' && (
                                                <button
                                                    onClick={() => setDeleteTarget(d)}
                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={destroy}
                title={`Delete "${deleteTarget?.originalFilename}"?`}
                description="This will permanently delete the document. You can upload a new one anytime."
                confirmLabel="Delete"
                variant="danger"
                loading={deleting}
            />
        </div>
    )
}