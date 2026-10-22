import { useState } from 'react'
import { motion } from 'framer-motion'
import { X as CloseIcon, Building2, Save, AlertCircle } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'

export default function UniversityDetailsModal({ university, onClose, onSaved }) {
    const { push } = useToastStore()
    const [form, setForm] = useState({
        name: university.name || '',
        code: university.code || '',
        emailDomain: university.emailDomain || '',
        logoUrl: university.logoUrl || '',
        isActive: university.isActive !== false,
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value })

    const save = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            // Assumes you have a PUT endpoint for updating a university
            await api.put(`/api/super-admin/universities/${university.id}`, form)
            push({ type: 'success', message: 'University updated successfully' })
            onSaved()
            onClose()
        } catch (err) {
            setError(err.message || 'Failed to update university')
        } finally {
            setSaving(false)
        }
    }

    const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">

                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Manage University</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Update details for {university.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={save} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">University Name</label>
                                <input type="text" value={form.name} onChange={setField('name')} required className={inputClass} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Code (e.g. LAUTECH)</label>
                                <input type="text" value={form.code} onChange={setField('code')} required className={inputClass} />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Domain (e.g. student.lautech.edu.ng)</label>
                            <input type="text" value={form.emailDomain} onChange={setField('emailDomain')} placeholder="Leave blank for no restriction" className={inputClass} />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Logo URL</label>
                            <input type="url" value={form.logoUrl} onChange={setField('logoUrl')} placeholder="https://..." className={inputClass} />
                        </div>

                        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Active Status</div>
                                <p className="text-xs text-slate-500">If disabled, all users from this university will be locked out.</p>
                            </div>
                            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                        </label>

                        {error && (
                            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
                            <Button type="submit" icon={Save} loading={saving} disabled={saving}>Save Changes</Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </>
    )
}