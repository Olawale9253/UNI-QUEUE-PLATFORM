import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Upload,
    FileText,
    Download,
    Trash2,
    X,
    CloudUpload,
    AlertCircle,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import {
    DOCUMENT_TYPES,
    DOCUMENT_TYPE_MAP,
    formatFileSize,
    ALLOWED_MIME,
    MAX_FILE_SIZE,
} from '../../lib/documents'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../lib/format'
import { stagger, staggerItem } from '../../lib/motion'

export default function DocumentsTab() {
    const { push } = useToastStore()
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [activeTicketId, setActiveTicketId] = useState(null)
    const [selectedType, setSelectedType] = useState('PAYMENT_PROOF')
    const [linkToActiveTicket, setLinkToActiveTicket] = useState(false)
    const fileInputRef = useRef(null)

    const load = useCallback(async () => {
        try {
            const [docs, active] = await Promise.all([
                api.get('/api/user/documents'),
                api.get('/api/user/tickets/active').catch(() => ({ data: { data: null } })),
            ])
            setDocuments(docs.data.data || [])
            setActiveTicketId(active.data.data?.id || null)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load documents' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    const validateFile = (file) => {
        if (file.size > MAX_FILE_SIZE) {
            push({ type: 'error', message: `File too large. Max ${formatFileSize(MAX_FILE_SIZE)}.` })
            return false
        }
        if (!ALLOWED_MIME.includes(file.type)) {
            push({ type: 'error', message: 'Only PDF, PNG, JPG, or WEBP files are allowed.' })
            return false
        }
        return true
    }

    const uploadFile = async (file) => {
        if (!validateFile(file)) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', selectedType)
            if (linkToActiveTicket && activeTicketId) {
                formData.append('ticketId', String(activeTicketId))
            }

            await api.post('/api/user/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            push({ type: 'success', message: 'Document uploaded' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Upload failed' })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleFileInput = (e) => {
        const file = e.target.files?.[0]
        if (file) uploadFile(file)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) uploadFile(file)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setDragOver(true)
    }

    const handleDragLeave = () => setDragOver(false)

    const download = async (doc) => {
        try {
            const res = await api.get(`/api/user/documents/${doc.id}/download`, {
                responseType: 'blob',
            })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.download = doc.originalFilename || 'document'
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            push({ type: 'error', message: 'Download failed' })
        }
    }

    const deleteDoc = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/user/documents/${deleteTarget.id}`)
            push({ type: 'success', message: 'Document deleted' })
            setDeleteTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Delete failed' })
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    My Documents
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Upload payment proofs, transcripts, ID cards, and other supporting documents.
                    Attach them to a ticket to help staff process you faster.
                </p>
            </div>

            {/* Upload card */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Document type
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            disabled={uploading}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 disabled:opacity-50"
                        >
                            {DOCUMENT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {activeTicketId && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Link to active ticket
                            </label>
                            <label className="flex h-[42px] cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    checked={linkToActiveTicket}
                                    onChange={(e) => setLinkToActiveTicket(e.target.checked)}
                                    disabled={uploading}
                                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                />
                                Attach to my current ticket (helps staff find it faster)
                            </label>
                        </div>
                    )}
                </div>

                {/* Drop zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                        dragOver
                            ? 'border-brand-500 bg-brand-50'
                            : uploading
                                ? 'border-slate-200 bg-slate-50 opacity-60'
                                : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_MIME.join(',')}
                        onChange={handleFileInput}
                        disabled={uploading}
                        className="hidden"
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <CloudUpload className="h-8 w-8 animate-pulse text-brand-600" />
                            <p className="text-sm font-medium text-slate-700">Uploading…</p>
                        </div>
                    ) : (
                        <>
                            <CloudUpload className="h-10 w-10 text-brand-600" />
                            <p className="mt-3 text-sm font-medium text-slate-900">
                                Click to upload or drag & drop
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                PDF, PNG, JPG, or WEBP · Max {formatFileSize(MAX_FILE_SIZE)}
                            </p>
                        </>
                    )}
                </div>
            </Card>

            {/* Documents list */}
            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
                        >
                            <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                                <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No documents yet"
                    description="Upload your first document above. You can attach them to tickets you've joined."
                />
            ) : (
                <motion.div
                    variants={stagger(0, 0.04)}
                    initial="initial"
                    animate="animate"
                    className="space-y-2"
                >
                    {documents.map((doc) => {
                        const type = DOCUMENT_TYPE_MAP[doc.type] || DOCUMENT_TYPE_MAP.OTHER
                        const Icon = type.icon

                        return (
                            <motion.div
                                key={doc.id}
                                variants={staggerItem}
                                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${type.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {doc.originalFilename}
                      </span>
                                            <Badge variant="default">{type.label}</Badge>
                                            {doc.ticketNumber && (
                                                <Badge variant="indigo">
                                                    Ticket {doc.ticketNumber}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                            <span>{formatFileSize(doc.sizeBytes)}</span>
                                            <span>{formatDateTime(doc.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2 sm:self-center">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={Download}
                                        onClick={() => download(doc)}
                                    >
                                        Download
                                    </Button>
                                    <button
                                        onClick={() => setDeleteTarget(doc)}
                                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                        aria-label="Delete document"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={deleteDoc}
                title={`Delete "${deleteTarget?.originalFilename}"?`}
                description="This will permanently remove the file. Documents for closed tickets cannot be deleted."
                confirmLabel="Delete document"
                variant="danger"
                loading={deleting}
            />
        </div>
    )
}