import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarX, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import api from '../../api/axios'
import Button from '../ui/Button'
import { useToastStore } from '../../store/toastStore'

function formatDate(iso) {
    if (!iso) return '—'
    try {
        return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        })
    } catch {
        return iso
    }
}

export default function ClosedDatesPanel() {
    const { push } = useToastStore()
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [date, setDate] = useState('')
    const [reason, setReason] = useState('')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/admin/closed-dates')
            setList(res.data?.data || [])
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load closed dates' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    const add = async (e) => {
        e.preventDefault()
        if (!date) {
            push({ type: 'error', message: 'Pick a date first' })
            return
        }
        setSaving(true)
        try {
            await api.post('/api/admin/closed-dates', {
                closedDate: date,
                reason: reason.trim() || null,
            })
            push({ type: 'success', message: 'Closed date added' })
            setDate('')
            setReason('')
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to add' })
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/api/admin/closed-dates/${deleteTarget.id}`)
            push({ type: 'success', message: 'Closed date removed' })
            setDeleteTarget(null)
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to remove' })
        } finally {
            setDeleting(false)
        }
    }

    const today = new Date().toISOString().slice(0, 10)

    return (
        <div>
            {/* Add form */}
            <form onSubmit={add} className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr_auto]">
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        min={today}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Reason <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={255}
                        placeholder="e.g. Independence Day"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                    />
                </div>
                <div className="flex items-end">
                    <Button type="submit" icon={Plus} loading={saving} disabled={saving || !date}>
                        Add
                    </Button>
                </div>
            </form>

            {/* List */}
            <div className="mt-5">
                {loading ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading…
                    </div>
                ) : list.length === 0 ? (
                    <div className="flex items-start gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                        <CalendarX className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            No closed dates yet. When you add a date here, all queues
                            are automatically closed for the whole day.
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        <AnimatePresence initial={false}>
                            {list.map((d) => (
                                <motion.li
                                    key={d.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center justify-between gap-3 py-3"
                                >
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatDate(d.closedDate)}
                                        </div>
                                        {d.reason && (
                                            <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                {d.reason}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(d)}
                                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                        aria-label="Remove"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                )}
            </div>

            {/* Delete confirm */}
            <AnimatePresence>
                {deleteTarget && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !deleting && setDeleteTarget(null)}
                            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40">
                                        <AlertCircle className="h-5 w-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            Remove this closed date?
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {formatDate(deleteTarget.closedDate)} will no longer be a
                                            holiday. Queues will operate normally on that day.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setDeleteTarget(null)}
                                        disabled={deleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        loading={deleting}
                                        disabled={deleting}
                                        onClick={confirmDelete}
                                        className="bg-rose-600 hover:bg-rose-700"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}