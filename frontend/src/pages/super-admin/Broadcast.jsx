import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Send, Megaphone, Users, Building2, AlertCircle, CheckCircle2,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToastStore } from '../../store/toastStore'

const ROLE_OPTIONS = [
    { value: '', label: 'All roles' },
    { value: 'ADMIN', label: 'Admins only' },
    { value: 'STAFF', label: 'Staff only' },
    { value: 'USER', label: 'Students only' },
]

export default function Broadcast() {
    const { push } = useToastStore()
    const [universities, setUniversities] = useState([])
    const [recipientCount, setRecipientCount] = useState(null)
    const [countLoading, setCountLoading] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [sending, setSending] = useState(false)

    const [form, setForm] = useState({
        title: '',
        message: '',
        universityId: '',
        role: '',
    })

    const loadUniversities = useCallback(async () => {
        try {
            const res = await api.get('/api/super-admin/universities')
            setUniversities(res.data.data || [])
        } catch {
            // silent
        }
    }, [])

    useEffect(() => {
        loadUniversities()
    }, [loadUniversities])

    useEffect(() => {
        const fetchCount = async () => {
            setCountLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('page', '0')
                params.append('size', '1')
                if (form.universityId) params.append('universityId', form.universityId)
                if (form.role) params.append('role', form.role)
                params.append('isActive', 'true')

                const res = await api.get(`/api/super-admin/users?${params.toString()}`)
                setRecipientCount(res.data.data.totalElements)
            } catch {
                setRecipientCount(null)
            } finally {
                setCountLoading(false)
            }
        }
        const token = setTimeout(fetchCount, 300)
        return () => clearTimeout(token)
    }, [form.universityId, form.role])

    const setField = (file) => (event) => setForm({ ...form, [file]: event.target.value })

    const handleSendClick = (event) => {
        event.preventDefault()
        if (!form.title.trim() || !form.message.trim()) {
            push({ type: 'error', message: 'Title and message are required' })
            return
        }
        setConfirmOpen(true)
    }

    const confirmSend = async () => {
        setSending(true)
        try {
            const payload = {
                title: form.title.trim(),
                message: form.message.trim(),
                universityId: form.universityId ? Number(form.universityId) : null,
                role: form.role || null,
            }
            const res = await api.post('/api/super-admin/broadcast', payload)
            push({ type: 'success', message: res.data.message })
            setConfirmOpen(false)
            setForm({ title: '', message: '', universityId: '', role: '' })
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to send' })
        } finally {
            setSending(false)
        }
    }

    const universityOptions = universities.map((university) => ({
        value: university.id,
        label: `${university.code} · ${university.name}`,
    }))

    const audienceLabel = [
        form.universityId
            ? universities.find((universityValue) => String(universityValue.id) === String(form.universityId))?.name
            : 'All universities',
        form.role ? `(${form.role.toLowerCase()}s only)` : '(all roles)',
    ].join(' ')

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    System Broadcast
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Send platform-wide announcements and alerts directly to user notification bells.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Compose Form */}
                <div className="lg:col-span-2">
                    <Card>
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                <Megaphone className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Compose Message</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Only users with active accounts will receive this notification.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSendClick} className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Announcement Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={setField('title')}
                                    placeholder="e.g. Scheduled maintenance this weekend"
                                    maxLength={255}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Message Body <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={6}
                                    value={form.message}
                                    onChange={setField('message')}
                                    placeholder="Write your announcement here. Keep it clear and concise..."
                                    maxLength={2000}
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
                                    required
                                />
                                <div className="mt-1.5 flex justify-end">
                                    <span className="text-xs font-medium text-slate-400">
                                        {form.message.length} / 2000
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <Select
                                    label="Target University"
                                    value={form.universityId}
                                    onChange={setField('universityId')}
                                    options={universityOptions}
                                    placeholder="All universities"
                                />
                                <Select
                                    label="Target Role"
                                    value={form.role}
                                    onChange={setField('role')}
                                    options={ROLE_OPTIONS}
                                />
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button type="submit" icon={Send} disabled={sending}>
                                    Send Broadcast
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Preview Panel */}
                <div className="space-y-6">
                    <Card>
                        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <Users className="h-4 w-4 text-brand-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Audience Preview</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Estimated Recipients
                                </div>
                                <div className="mt-1 flex items-baseline gap-2">
                                    {countLoading ? (
                                        <span className="text-sm font-medium text-slate-500">Calculating…</span>
                                    ) : (
                                        <>
                                            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                                                {recipientCount ?? '—'}
                                            </span>
                                            <span className="text-sm font-medium text-slate-500">users</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Target Scope
                                </div>
                                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {audienceLabel}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <div className="mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Important Notes</h3>
                        </div>
                        <ul className="space-y-2.5 text-xs text-amber-800 dark:text-amber-300">
                            <li className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                <span>Broadcasts appear instantly in the recipient's notification bell.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                <span>Recipients can dismiss them like any other notification.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                <span>Disabled accounts are automatically skipped.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onClose={() => !sending && setConfirmOpen(false)}
                onConfirm={confirmSend}
                title="Send this broadcast?"
                description={`"${form.title}" will be sent to ${recipientCount ?? '?'} users. This action cannot be undone.`}
                confirmLabel="Yes, send now"
                variant="info"
                loading={sending}
            />
        </div>
    )
}