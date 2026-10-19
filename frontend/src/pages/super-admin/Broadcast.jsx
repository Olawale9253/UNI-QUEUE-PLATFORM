import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Send,
    Megaphone,
    Users,
    Building2,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/layout/PageHeader'
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

    // Preview recipient count when filters change
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
        <>
            <PageHeader
                title="Broadcast"
                description="Send announcements to users across the platform. They'll appear in their notification bell."
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Compose form */}
                <div className="lg:col-span-2">
                    <Card>
                        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                                <Megaphone className="h-4 w-4 text-brand-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">Compose message</h2>
                                <p className="text-xs text-slate-500">
                                    Only users with active accounts will receive it.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSendClick} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={setField('title')}
                                    placeholder="e.g. Scheduled maintenance this weekend"
                                    maxLength={255}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Message <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={6}
                                    value={form.message}
                                    onChange={setField('message')}
                                    placeholder="Write your announcement here. Keep it short and clear."
                                    maxLength={2000}
                                    className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                                    required
                                />
                                <div className="mt-1 flex justify-end">
                  <span className="text-xs text-slate-500">
                    {form.message.length} / 2000
                  </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Select
                                    label="Target university"
                                    value={form.universityId}
                                    onChange={setField('universityId')}
                                    options={universityOptions}
                                    placeholder="All universities"
                                />
                                <Select
                                    label="Target role"
                                    value={form.role}
                                    onChange={setField('role')}
                                    options={ROLE_OPTIONS}
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    icon={Send}
                                    disabled={sending}
                                >
                                    Send broadcast
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Preview panel */}
                <div className="space-y-4">
                    <Card>
                        <div className="mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4 text-brand-600" />
                            <h3 className="text-sm font-semibold text-slate-900">Audience</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Recipients
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    {countLoading ? (
                                        <span className="text-sm text-slate-500">Calculating…</span>
                                    ) : (
                                        <>
                      <span className="text-2xl font-semibold text-slate-900">
                        {recipientCount ?? '—'}
                      </span>
                                            <span className="text-sm text-slate-500">users</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Scope
                                </div>
                                <div className="mt-1 text-sm font-medium text-slate-900">
                                    {audienceLabel}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <h3 className="text-sm font-semibold text-slate-900">Good to know</h3>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-600">
                            <li className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>Broadcasts appear in the recipient's notification bell instantly.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>Recipients can dismiss them like any other notification.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>Disabled accounts are skipped automatically.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>The action is recorded in Audit Logs.</span>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onClose={() => !sending && setConfirmOpen(false)}
                onConfirm={confirmSend}
                title="Send this broadcast?"
                description={`"${form.title}" will be sent to ${recipientCount ?? '?'} users. This cannot be undone.`}
                confirmLabel="Send broadcast"
                variant="info"
                loading={sending}
            />
        </>
    )
}