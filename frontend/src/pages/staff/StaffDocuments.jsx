import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText, CheckCircle2, XCircle, Clock, Filter, Search, Eye,
    User, Hash, Download, AlertCircle, FileCheck
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/Skeleton'
import DocumentReviewModal from '../../components/staff/DocumentReviewModal'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

const STATUS_VARIANTS = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
}

const STATUS_LABELS = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
}

const FILTERS = [
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

export default function StaffDocuments() {
    const { push } = useToastStore()
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('PENDING')
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState(null)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/staff/documents', {
                params: { status: filter },
            })
            setDocs(res.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load documents' })
        } finally {
            setLoading(false)
        }
    }, [filter, push])

    useEffect(() => { load() }, [load])
    useAdaptivePoll(load, { fastMs: 10000, slowMs: 30000 })

    const filtered = useMemo(() => {
        if (!search.trim()) return docs
        const stringValue = search.trim().toLowerCase()
        return docs.filter(
            (doc) =>
                doc.originalFilename?.toLowerCase().includes(stringValue) ||
                doc.uploadedByName?.toLowerCase().includes(stringValue) ||
                doc.ticketNumber?.toLowerCase().includes(stringValue)
        )
    }, [docs, search])

    const download = async (doc) => {
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

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <Card padded={false}>
                    {Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)}
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Documents
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Review and manage documents students have uploaded.
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                    <Filter className="mr-1 h-3.5 w-3.5 text-slate-400" />
                    {FILTERS.map((item) => {
                        const isActive = filter === item.value
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setFilter(item.value)}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    isActive
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                }`}
                            >
                                {item.label}
                            </button>
                        )
                    })}
                </div>

                {docs.length > 0 && (
                    <div className="w-full max-w-sm">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search documents..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            {docs.length === 0 ? (
                <EmptyState
                    icon={FileCheck}
                    title={`No ${filter.toLowerCase()} documents`}
                    description={
                        filter === 'PENDING'
                            ? "You're all caught up. Nothing to review right now."
                            : `No ${filter.toLowerCase()} documents yet.`
                    }
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Filter}
                    title="No matches"
                    description="Try a different search term."
                    action={<Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button>}
                />
            ) : (
                <div className="space-y-4">
                    {filtered.map((itemValue, idx) => {
                        const isPending = itemValue.status === 'PENDING'
                        return (
                            <motion.div
                                key={itemValue.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                            >
                                <Card className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 flex-1 items-start gap-4">
                                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                                itemValue.status === 'APPROVED'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                    : itemValue.status === 'REJECTED'
                                                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                            }`}>
                                                {itemValue.status === 'APPROVED' ? (
                                                    <CheckCircle2 className="h-5 w-5" />
                                                ) : itemValue.status === 'REJECTED' ? (
                                                    <XCircle className="h-5 w-5" />
                                                ) : (
                                                    <Clock className="h-5 w-5" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                                                        {itemValue.originalFilename}
                                                    </h3>
                                                    <Badge variant={STATUS_VARIANTS[itemValue.status] || 'default'}>
                                                        {STATUS_LABELS[itemValue.status] || itemValue.status}
                                                    </Badge>
                                                </div>

                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{itemValue.type}</span>
                                                    <span>·</span>
                                                    <span>{formatSize(itemValue.sizeBytes)}</span>
                                                </div>

                                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5 shrink-0" />
                                                        {itemValue.uploadedByName || 'Unknown'}
                                                    </span>
                                                    {itemValue.ticketNumber && (
                                                        <span className="flex items-center gap-1 font-mono font-medium">
                                                            <Hash className="h-3.5 w-3.5 shrink-0" />
                                                            {itemValue.ticketNumber}
                                                        </span>
                                                    )}
                                                    <span className="font-medium">{formatDateTime(itemValue.createdAt)}</span>
                                                </div>

                                                {itemValue.status === 'REJECTED' && itemValue.reviewNotes && (
                                                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                        <div>
                                                            <span className="font-bold">Reason: </span>
                                                            {itemValue.reviewNotes}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2 mt-2 sm:mt-0">
                                            <button
                                                onClick={() => download(itemValue)}
                                                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                                title="Download"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            {isPending && (
                                                <Button
                                                    size="sm"
                                                    icon={Eye}
                                                    onClick={() => setSelected(itemValue)}
                                                >
                                                    Review
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <AnimatePresence>
                {selected && (
                    <DocumentReviewModal
                        document={selected}
                        onClose={() => setSelected(null)}
                        onReviewed={load}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}