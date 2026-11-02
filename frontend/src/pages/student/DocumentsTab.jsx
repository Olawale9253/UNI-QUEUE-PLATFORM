import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Upload, FileText, Trash2, Download, AlertCircle, Eye,
    CheckCircle2, Clock, XCircle, Search, Filter,
    GraduationCap, UserSquare2, Wallet, Home, Cross,
    ShieldCheck, HelpCircle, FileQuestion, FileCheck, ChevronRight
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useUniversityStore } from '../../store/universityStore'
import { withAlpha } from '../../lib/colors'

// Map DB types to UI categories
const CATEGORY_MAPPING = {
    'TRANSCRIPT': 'Academic',
    'CERTIFICATE': 'Academic',
    'ADMISSION_LETTER': 'Academic',
    'ID_CARD': 'Identity',
    'PAYMENT_PROOF': 'Financial',
    'MEDICAL_REPORT': 'Medical',
    'OTHER': 'Accommodation' // Defaulting OTHER to Accommodation for the 5th card
}

const DOC_TYPES = [
    { value: 'TRANSCRIPT', label: 'Academic Transcript' },
    { value: 'CERTIFICATE', label: 'Certificate' },
    { value: 'ADMISSION_LETTER', label: 'Admission Letter' },
    { value: 'ID_CARD', label: 'Student ID Card' },
    { value: 'PAYMENT_PROOF', label: 'School Fee Receipt' },
    { value: 'MEDICAL_REPORT', label: 'Medical Report' },
    { value: 'OTHER', label: 'Accommodation Form' },
]

const CATEGORIES = [
    { id: 'Academic', icon: GraduationCap },
    { id: 'Identity', icon: UserSquare2 },
    { id: 'Financial', icon: Wallet },
    { id: 'Accommodation', icon: Home },
    { id: 'Medical', icon: Cross },
]

const STATUS_VARIANTS = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }
const STATUS_ICONS = { PENDING: Clock, APPROVED: CheckCircle2, REJECTED: XCircle }

function formatSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateTime(dt) {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function DocumentsTab() {
    const { push } = useToastStore()
    const { university } = useUniversityStore()

    // Get the school's primary color (fallback to indigo if not set)
    const primaryColor = university?.primaryColor || '#4f46e5'

    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const [search, setSearch] = useState('')
    const [activeStatus, setActiveStatus] = useState('ALL')
    const [activeCategory, setActiveCategory] = useState('ALL')

    const [selectedType, setSelectedType] = useState('OTHER')
    const fileInputRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/user/documents')
            setDocs(res.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: 'Failed to load documents' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    // --- UPLOAD HANDLING ---
    const processFile = async (file) => {
        if (!file) return
        setUploading(true)
        try {
            const form = new FormData()
            form.append('file', file)
            form.append('type', selectedType)
            await api.post('/api/user/documents', form)
            push({ type: 'success', message: 'Document uploaded successfully' })
            if (fileInputRef.current) fileInputRef.current.value = ''
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Upload failed' })
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) processFile(file)
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
    }

    // --- FILTERING ---
    const filtered = useMemo(() => {
        return docs.filter(doc => {
            const category = CATEGORY_MAPPING[doc.type] || 'Other'

            const matchSearch = doc.originalFilename.toLowerCase().includes(search.toLowerCase())
            const matchStatus = activeStatus === 'ALL' || doc.status === activeStatus
            const matchCategory = activeCategory === 'ALL' || category === activeCategory

            return matchSearch && matchStatus && matchCategory
        })
    }, [docs, search, activeStatus, activeCategory])

    const counts = useMemo(() => {
        return {
            ALL: docs.length,
            PENDING: docs.filter(d => d.status === 'PENDING').length,
            APPROVED: docs.filter(d => d.status === 'APPROVED').length,
            REJECTED: docs.filter(d => d.status === 'REJECTED').length,
            Academic: docs.filter(d => CATEGORY_MAPPING[d.type] === 'Academic').length,
            Identity: docs.filter(d => CATEGORY_MAPPING[d.type] === 'Identity').length,
            Financial: docs.filter(d => CATEGORY_MAPPING[d.type] === 'Financial').length,
            Accommodation: docs.filter(d => CATEGORY_MAPPING[d.type] === 'Accommodation').length,
            Medical: docs.filter(d => CATEGORY_MAPPING[d.type] === 'Medical').length,
        }
    }, [docs])

    const destroy = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/user/documents/${deleteTarget.id}`)
            push({ type: 'success', message: 'Document deleted' })
            setDeleteTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: 'Failed to delete' })
        } finally {
            setDeleting(false)
        }
    }

    const download = async (doc) => {
        try {
            const res = await api.get(`/api/documents/${doc.id}/download`, { responseType: 'blob' })
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = doc.originalFilename || 'document'
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            push({ type: 'error', message: 'Download failed' })
        }
    }

    if (loading) {
        return (
            <div className="px-4 sm:px-6 py-8">
                <Card padded={false}>{[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}</Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12 px-4 sm:px-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Documents</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Upload, manage and access your important university documents.
                </p>
            </div>

            {/* Banner (Dynamic School Color) */}
            <div
                className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${withAlpha(primaryColor, 0.8)} 100%)`
                }}
            >
                <div className="relative z-10 max-w-lg">
                    <h2 className="text-xl sm:text-2xl font-bold">Keep your documents ready!</h2>
                    <p className="mt-2 text-sm text-white/90">
                        Upload and manage your documents for a smooth university experience.
                    </p>
                </div>
                <div className="relative z-10 flex gap-4 sm:gap-6 text-xs sm:text-sm font-medium">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-white" /> Fast verification</div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-white" /> Easy access</div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-white" /> Seamless processes</div>
                    </div>
                </div>
                {/* Decorative background circles */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute right-20 -bottom-10 h-32 w-32 rounded-full bg-white/20 blur-xl" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
                {/* LEFT COLUMN */}
                <div className="space-y-6 min-w-0">
                    {/* Category Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {CATEGORIES.map((cat) => {
                            const isActive = activeCategory === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(isActive ? 'ALL' : cat.id)}
                                    className={`flex flex-col items-start p-3 sm:p-4 rounded-xl border text-left transition-all ${
                                        isActive
                                            ? 'ring-2 border-transparent bg-white dark:bg-slate-800 shadow-md'
                                            : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700`
                                    }`}
                                    style={isActive ? { '--tw-ring-color': primaryColor } : {}}
                                >
                                    <div
                                        className="p-2 rounded-lg mb-3"
                                        style={{
                                            backgroundColor: withAlpha(primaryColor, 0.1),
                                            color: primaryColor
                                        }}
                                    >
                                        <cat.icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                        {cat.id} Documents
                                    </h3>
                                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">{counts[cat.id] || 0} files</p>
                                </button>
                            )
                        })}
                    </div>

                    {/* Drag & Drop Upload Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`relative flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-dashed transition-colors ${
                            isDragging
                                ? 'bg-slate-50 dark:bg-slate-900/50'
                                : 'border-slate-300 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50'
                        }`}
                        style={isDragging ? { borderColor: primaryColor } : {}}
                    >
                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-full shrink-0"
                                style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                            >
                                <Upload className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Drag and drop your files here, or click to upload</p>
                                <p className="text-xs text-slate-500 mt-1">Supported formats: PDF, JPG, PNG | Max size: 5MB per file</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="doc-upload" />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                loading={uploading}
                                className="whitespace-nowrap shadow-none text-white"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Upload className="mr-2 h-4 w-4" /> Upload Document
                            </Button>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="space-y-4">
                        {/* Table Filters */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
                                {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((status) => {
                                    const isActive = activeStatus === status
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => setActiveStatus(status)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                                                isActive
                                                    ? 'text-white shadow-sm'
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
                                            }`}
                                            style={isActive ? { backgroundColor: primaryColor } : {}}
                                        >
                                            {status === 'ALL' ? 'All Documents' : status.charAt(0) + status.slice(1).toLowerCase()}
                                            <span
                                                className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}
                                            >
                                                {counts[status] || 0}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="flex items-center gap-2 w-full lg:w-auto">
                                <div className="relative flex-1 lg:w-64">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search documents..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        style={{ focusBorderColor: primaryColor }}
                                    />
                                </div>
                                <Button variant="secondary" className="shrink-0 text-xs px-3 py-2 border-slate-200 dark:border-slate-700">
                                    <Filter className="mr-1.5 h-3.5 w-3.5" /> Filter
                                </Button>
                            </div>
                        </div>

                        {/* Data Table */}
                        <Card padded={false} className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Document Name</th>
                                        <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Category</th>
                                        <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">File Size</th>
                                        <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Uploaded On</th>
                                        <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                        <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300 text-center">Action</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center">
                                                <EmptyState icon={FileText} title="No documents found" description="Try changing your filters or upload a new document." bordered={false} />
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((doc) => {
                                            const category = CATEGORY_MAPPING[doc.type] || 'Other'
                                            const StatusIcon = STATUS_ICONS[doc.status] || Clock

                                            return (
                                                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                                                                style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </div>
                                                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={doc.originalFilename}>
                                                                    {doc.originalFilename}
                                                                </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <Badge variant="default" className="bg-slate-100 text-slate-600 font-medium">
                                                            {category}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-500">{formatSize(doc.sizeBytes)}</td>
                                                    <td className="px-5 py-4 text-slate-500 text-xs">{formatDateTime(doc.createdAt)}</td>
                                                    <td className="px-5 py-4">
                                                        <Badge variant={STATUS_VARIANTS[doc.status] || 'default'} className="flex w-fit items-center gap-1">
                                                            <StatusIcon className="h-3 w-3" />
                                                            {doc.status === 'PENDING' ? 'Under Review' : doc.status.charAt(0) + doc.status.slice(1).toLowerCase()}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => download(doc)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md" title="Download">
                                                                <Download className="h-4 w-4" />
                                                            </button>
                                                            {doc.status !== 'APPROVED' && (
                                                                <button onClick={() => setDeleteTarget(doc)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-md" title="Delete">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Table Footer */}
                            {filtered.length > 0 && (
                                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-5 py-3 text-xs text-slate-500">
                                    <span>Showing 1 – {filtered.length} of {filtered.length} documents</span>
                                    <div className="flex gap-1">
                                        <button className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-50" disabled>&lt;</button>
                                        <button
                                            className="px-3 py-1 rounded text-white font-medium"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            1
                                        </button>
                                        <button className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-50" disabled>&gt;</button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="space-y-4">
                    {/* Guidelines */}
                    <Card className="p-5 border-slate-200 dark:border-slate-800">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
                            <FileCheck className="h-4 w-4" style={{ color: primaryColor }} /> Document Guidelines
                        </h3>
                        <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                            <li className="flex gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                Accepted formats: PDF, JPG, PNG
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                Maximum file size: 5MB per file
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                Ensure clear and readable files
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                Upload original documents only
                            </li>
                        </ul>
                    </Card>

                    {/* Help */}
                    <Card
                        className="p-5 border-slate-200 dark:border-slate-800"
                        style={{ backgroundColor: withAlpha(primaryColor, 0.05) }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="p-2 rounded-full"
                                style={{ backgroundColor: withAlpha(primaryColor, 0.1), color: primaryColor }}
                            >
                                <HelpCircle className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Need Help?</h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                            Contact support for assistance with your documents.
                        </p>
                        <Button
                            variant="secondary"
                            className="w-full justify-center hover:opacity-90"
                            style={{ borderColor: primaryColor, color: primaryColor, backgroundColor: 'transparent' }}
                        >
                            Contact Support
                        </Button>
                    </Card>

                    {/* Quick Links */}
                    <Card className="p-5 border-slate-200 dark:border-slate-800">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
                            <FileQuestion className="h-4 w-4 text-slate-500" /> Quick Links
                        </h3>
                        <div className="space-y-1">
                            {['View Document Requirements', 'Frequently Asked Questions', 'Official Student Handbook'].map((link) => (
                                <a
                                    key={link}
                                    href="#"
                                    className="flex items-center justify-between py-2 text-xs font-medium text-slate-600 hover:opacity-80 dark:text-slate-400 group"
                                    style={{ color: primaryColor }}
                                >
                                    {link}
                                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </a>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

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