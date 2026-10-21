import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    X as CloseIcon, Building2, MapPin, AlertCircle, Trash2, Clock,
    Type, FileText, Sparkles
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

function Field({ label, icon: Icon, hint, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
            </label>
            {children}
            {hint && !error && <p className="text-[11px] leading-relaxed text-slate-400">{hint}</p>}
            {error && <p className="text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
    )
}

function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                checked ? 'bg-brand-600 hover:bg-brand-700' : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600'
            }`}
        >
            <span className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow transition-transform duration-200 ${
                checked ? 'translate-x-6' : 'translate-x-1'
            }`} />
        </button>
    )
}

export default function OfficeFormModal({ office, onClose, onSaved, onDeleted }) {
    const { push } = useToastStore()
    const isEdit = !!office

    const [form, setForm] = useState({
        name: '',
        description: '',
        location: '',
        icon: '',
        openingTime: '09:00',
        closingTime: '17:00',
        slotDurationMinutes: 15,
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
                openingTime: office.openingTime ? String(office.openingTime).slice(0, 5) : '09:00',
                closingTime: office.closingTime ? String(office.closingTime).slice(0, 5) : '17:00',
                slotDurationMinutes: office.slotDurationMinutes ?? 15,
                isActive: office.isActive !== false,
            })
        }
    }, [office])

    const setField = (key) => (event) => setForm({ ...form, [key]: event.target.value })

    const save = async (event) => {
        event.preventDefault()
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
                openingTime: form.openingTime ? `${form.openingTime}:00` : null,
                closingTime: form.closingTime ? `${form.closingTime}:00` : null,
                slotDurationMinutes: Number(form.slotDurationMinutes) || 15,
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
            setError(err.message || 'Failed to save office')
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
            setError(err.message || 'Failed to delete office')
            setConfirmDelete(false)
        } finally {
            setDeleting(false)
        }
    }

    // Premium input styling
    const inputClass =
        'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !saving && !deleting && onClose()}
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2 }}
                    onClick={(eventValue) => eventValue.stopPropagation()}
                    className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                    {/* Modal Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {isEdit ? `Edit ${office.name}` : 'Create office'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isEdit ? 'Update the office details and working hours' : 'An office groups the services students see'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => !saving && !deleting && onClose()}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={save} className="space-y-6 p-6">
                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <Field label="Office name" icon={Type} hint="Examples: Bursary, Registry, Library, Health Centre">
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={setField('name')}
                                    placeholder="Enter office name"
                                    required
                                    autoFocus
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Location" icon={MapPin}>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={setField('location')}
                                        placeholder="e.g. Admin Block, 2nd Floor"
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </Field>

                            <Field label="Description" icon={FileText} hint="A brief summary of what this office handles">
                                <textarea
                                    value={form.description}
                                    onChange={setField('description')}
                                    placeholder="What does this office do?"
                                    rows={3}
                                    className={`${inputClass} resize-none`}
                                />
                            </Field>
                        </div>

                        {/* Working Hours & Appointments Section */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                                    <Clock className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Working hours & appointments
                                </h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                <Field label="Opens at">
                                    <input
                                        type="time"
                                        value={form.openingTime}
                                        onChange={setField('openingTime')}
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Closes at">
                                    <input
                                        type="time"
                                        value={form.closingTime}
                                        onChange={setField('closingTime')}
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Slot duration" hint="In minutes">
                                    <input
                                        type="number"
                                        min="5"
                                        max="240"
                                        value={form.slotDurationMinutes}
                                        onChange={setField('slotDurationMinutes')}
                                        className={inputClass}
                                    />
                                </Field>
                            </div>
                        </div>

                        {/* Icon & Status */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                            <div className="flex-1">
                                <Field label="Icon" icon={Sparkles}>
                                    <select
                                        value={form.icon}
                                        onChange={setField('icon')}
                                        className={inputClass}
                                    >
                                        {ICON_OPTIONS.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <div className="flex-1">
                                <Field label="Status">
                                    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                                        <div>
                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                Active
                                            </div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                Accepting students
                                            </div>
                                        </div>
                                        <Toggle
                                            checked={form.isActive}
                                            onChange={(val) => setForm({ ...form, isActive: val })}
                                        />
                                    </div>
                                </Field>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
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
                                            className="bg-rose-600 hover:bg-rose-700 text-white"
                                        >
                                            Confirm delete
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDelete(true)}
                                        disabled={saving || deleting}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
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