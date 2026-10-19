import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X as CloseIcon, Upload, Trash2, FileText, AlertTriangle, CheckCircle2,
    Loader2, Search,
} from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToastStore } from '../../store/toastStore'

export default function AdmittedStudentsModal({ university, onClose }) {
    const { push } = useToastStore()
    const fileRef = useRef(null)

    const [list, setList] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [clearing, setClearing] = useState(false)
    const [confirmClear, setConfirmClear] = useState(false)
    const [search, setSearch] = useState('')
    const [replaceExisting, setReplaceExisting] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const [item, stringValue] = await Promise.all([
                api.get(`/api/super-admin/universities/${university.id}/admitted-students`, {
                    params: { size: 100 },
                }),
                api.get(`/api/super-admin/universities/${university.id}/admitted-students/stats`),
            ])
            setList(item.data?.data?.content || [])
            setStats(stringValue.data?.data || null)
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load list' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [university.id])

    const onFile = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.csv')) {
            push({ type: 'error', message: 'Please select a .csv file' })
            return
        }

        setUploading(true)
        try {
            const form = new FormData()
            form.append('file', file)
            const res = await api.post(
                `/api/super-admin/universities/${university.id}/admitted-students/upload?replace=${replaceExisting}`,
                form,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )
            push({
                type: 'success',
                message: res.data?.message || 'Uploaded',
            })
            if (fileRef.current) fileRef.current.value = ''
            await load()
        } catch (err) {
            push({
                type: 'error',
                message: err.message || 'Upload failed',
            })
        } finally {
            setUploading(false)
        }
    }

    const clearAll = async () => {
        setClearing(true)
        try {
            await api.delete(`/api/super-admin/universities/${university.id}/admitted-students`)
            push({ type: 'success', message: 'List cleared' })
            setConfirmClear(false)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to clear' })
        } finally {
            setClearing(false)
        }
    }

    const filtered = search.trim()
        ? list.filter((item) => {
            const searchValue = search.toLowerCase()
            return (
                item.fullName?.toLowerCase().includes(searchValue) ||
                item.jambRegNumber?.toLowerCase().includes(searchValue) ||
                item.admissionRef?.toLowerCase().includes(searchValue) ||
                item.applicationNumber?.toLowerCase().includes(searchValue)
            )
        })
        : list

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    onClick={(eventValue) => eventValue.stopPropagation()}
                    className="relative my-8 w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>

                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Admitted students list for {university.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Upload a CSV so freshers can be verified against the official admission list.
                    </p>

                    {/* Stats */}
                    {stats && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                <div className="text-xs uppercase tracking-wide text-slate-500">Total</div>
                                <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                    {stats.total}
                                </div>
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                                <div className="text-xs uppercase tracking-wide text-emerald-600">Claimed</div>
                                <div className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
                                    {stats.claimed}
                                </div>
                            </div>
                            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/40">
                                <div className="text-xs uppercase tracking-wide text-sky-600">Available</div>
                                <div className="mt-1 text-2xl font-semibold text-sky-700 dark:text-sky-400">
                                    {stats.unclaimed}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload area */}
                    <div className="mt-5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-700">
                                <FileText className="h-6 w-6 text-slate-500" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    Upload admission list CSV
                                </div>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Required column: <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">full_name</code>.
                                    Optional: jamb_reg_number, admission_ref, application_number, department, faculty, admission_year.
                                </p>

                                <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={replaceExisting}
                                        onChange={(eventValue2) => setReplaceExisting(eventValue2.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    Replace existing list (deletes all rows first)
                                </label>

                                <div className="mt-3">
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={onFile}
                                        disabled={uploading}
                                        className="hidden"
                                        id="admitted-csv-input"
                                    />
                                    <label
                                        htmlFor="admitted-csv-input"
                                        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 ${
                                            uploading ? 'pointer-events-none opacity-60' : ''
                                        }`}
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Uploading…
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4" />
                                                Choose CSV file
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {stats?.total > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setConfirmClear(true)}
                                    className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                    title="Clear entire list"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    {loading ? (
                        <div className="mt-5 py-8 text-center text-sm text-slate-500">Loading…</div>
                    ) : list.length === 0 ? (
                        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800">
                            <div className="text-sm text-slate-500">No admitted students uploaded yet</div>
                        </div>
                    ) : (
                        <>
                            <div className="mt-5">
                                <Input
                                    placeholder="Search by name, JAMB, ref, or application number…"
                                    value={search}
                                    onChange={(eventValue3) => setSearch(eventValue3.target.value)}
                                    icon={Search}
                                />
                            </div>

                            <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">JAMB</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Ref</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filtered.map((itemValue) => (
                                        <tr key={itemValue.id} className="text-sm">
                                            <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{itemValue.fullName}</td>
                                            <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{itemValue.jambRegNumber || '—'}</td>
                                            <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{itemValue.admissionRef || itemValue.applicationNumber || '—'}</td>
                                            <td className="px-3 py-2">
                                                {itemValue.claimed ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Claimed
                            </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              Available
                            </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-500">
                                                No matches
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    <div className="mt-5 flex justify-end">
                        <Button variant="secondary" onClick={onClose}>
                            Done
                        </Button>
                    </div>

                    {/* Clear confirm */}
                    <AnimatePresence>
                        {confirmClear && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setConfirmClear(false)}
                                    className="absolute inset-0 rounded-xl bg-slate-900/60 backdrop-blur-sm"
                                />
                                <div className="absolute inset-0 flex items-center justify-center rounded-xl p-4">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={(eventValue4) => eventValue4.stopPropagation()}
                                        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900"
                                    >
                                        <div className="mb-3 flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40">
                                                <AlertTriangle className="h-5 w-5 text-rose-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                                    Clear entire list?
                                                </h4>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    This permanently deletes all {stats?.total} rows. Freshers won't be
                                                    able to register until you upload a new list.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end gap-2">
                                            <Button variant="secondary" onClick={() => setConfirmClear(false)} disabled={clearing}>
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={clearAll}
                                                loading={clearing}
                                                disabled={clearing}
                                                className="bg-rose-600 hover:bg-rose-700"
                                            >
                                                Clear all
                                            </Button>
                                        </div>
                                    </motion.div>
                                </div>
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </>
    )
}