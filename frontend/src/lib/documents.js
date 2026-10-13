import {
    Receipt,
    FileText,
    CreditCard,
    GraduationCap,
    Stethoscope,
    Award,
    File,
} from 'lucide-react'

export const DOCUMENT_TYPES = [
    { value: 'PAYMENT_PROOF', label: 'Payment Proof', icon: Receipt, color: 'text-emerald-600 bg-emerald-50' },
    { value: 'TRANSCRIPT', label: 'Transcript', icon: FileText, color: 'text-sky-600 bg-sky-50' },
    { value: 'ID_CARD', label: 'Student ID Card', icon: CreditCard, color: 'text-violet-600 bg-violet-50' },
    { value: 'ADMISSION_LETTER', label: 'Admission Letter', icon: GraduationCap, color: 'text-amber-600 bg-amber-50' },
    { value: 'MEDICAL_REPORT', label: 'Medical Report', icon: Stethoscope, color: 'text-rose-600 bg-rose-50' },
    { value: 'CERTIFICATE', label: 'Certificate', icon: Award, color: 'text-brand-600 bg-brand-50' },
    { value: 'OTHER', label: 'Other', icon: File, color: 'text-slate-600 bg-slate-100' },
]

export const DOCUMENT_TYPE_MAP = Object.fromEntries(
    DOCUMENT_TYPES.map((documentType) => [documentType.value, documentType])
)

export function formatFileSize(bytes) {
    if (bytes == null) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ALLOWED_MIME = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
]

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB]