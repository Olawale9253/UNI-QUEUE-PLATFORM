import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    X, Building2, MapPin, FileText, AlertCircle, Loader2, Trash2,
} from 'lucide-react'
import api from '../../api/axios'
import Button from '../ui/Button'
import { useToastStore } from '../../store/toastStore'

const ICON_OPTIONS = [
    { value: '', label: 'None' },
    { value: 'building-2', label: 'Building' },
    { value: 'landmark', label: 'Bank' },
    { value: 'book-open', label: 'Library' },
    { value: 'graduation-cap', label: 'Academic' },
    { value: 'credit-card', label: 'Payments' },
    { value: 'file-text', label: 'Records' },
    { value: 'heart-pulse', label: 'Health' },
    { value: 'shield', label: 'Security' },
    { value: 'users', label: 'Services' },
]

export default function OfficeFormModal({ office, onClose, onSaved, onDeleted }) {
    const { push } = useToastStore()
    const isEdit = !!office

    const [form, setForm] = useState({
        name: '',
        description: '',
        location: '',
        icon: '',
        isActive: true,
    })
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (office) {
            setForm({
                name: office.name || '',
                description: office.description || '',
                location: office.location || '',
                icon: office.icon || '',
                isActive: office.isActive !== false,
            })
        }
    }, [office])

    const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    const save = async (e) => {
        e.preventDefault()
        if (!form.name.trim()) {
            setError('Office name is required')
            return
        }
        setSaving(true)
        setError(null)
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || null,
                location: form.location.trim() || null,
                icon: form.icon || null,
                isActive: form.isActive,
            }
            if (isEdit) {
                await api.put(`/api/admin/offices/${office.id}`, payload)
                push({ type: 'success', message: 'Office updated' })
            } else {
                await api.post('/api/admin/offices', payload)
                push({ type: 'success', message: 'Office created' })
            }
            onSaved?.()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save office')
        } finally {
            setSaving(false)
        }
    }

    const destroy = async () => {
        setDeleting(true)
        setError(null)
        try {
            await api.delete(`/api/admin/offices/${office.id}`)
            push({ type: 'success', message: 'Office deleted' })
            onDeleted?.()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete office')
            setConfirmDelete(false)
        } finally {
            setDeleting(false)
        }
    }

    const inputClass =
        'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'

    const labelClass =
        'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300'

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !saving && !deleting && onClose()}
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative my-8 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                    <button
                        onClick={() => !saving && !deleting && onClose()}
                        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                            <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {isEdit ? `Edit ${office.name}` : 'Create office'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isEdit
                                    ? 'Update the office details'
                                    : 'An office groups the services students see'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={save} className="space-y-4">
                        <div>
                            <label className={labelClass}>Office name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={setField('name')}
                                placeholder="Enter office name"
                                required
                                autoFocus
                                className={inputClass}
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Examples: Bursary, Registry, Library, Health Centre
                            </p>
                        </div>

                        <div>
                            <label className={labelClass}>Location (optional)</label>
                            <div className="relative">
                                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={form.location}
                                    onChange={setField('location')}
                                    placeholder="Enter office location"
                                    className={`${inputClass} pl-9`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Description (optional)</label>
                            <textarea
                                value={form.description}
                                onChange={setField('description')}
                                placeholder="What does this office do?"
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Icon</label>
                            <select
                                value={form.icon}
                                onChange={setField('icon')}
                                className={inputClass}
                            >
                                {ICON_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    Active
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Students can find and join services from this office
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                        </label>

                        {error && (
                            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2">
                            {isEdit && (
                                confirmDelete ? (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setConfirmDelete(false)}
                                            disabled={deleting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={destroy}
                                            loading={deleting}
                                            className="bg-rose-600 hover:bg-rose-700"
                                        >
                                            Yes, delete
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDelete(true)}
                                        disabled={saving || deleting}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete office
                                    </button>
                                )
                            )}
                            <div className="ml-auto flex gap-2">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={saving || deleting}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={saving} disabled={saving || deleting}>
                                    {isEdit ? 'Save changes' : 'Create office'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </>
    )
}