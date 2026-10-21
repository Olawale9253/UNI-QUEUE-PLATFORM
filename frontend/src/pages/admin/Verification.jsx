import { useEffect, useState, useRef } from 'react'
import {
    CheckCircle2, XCircle, Search, Upload, Users, AlertCircle,
    RefreshCw, Loader2, FileText, Trash2, ShieldCheck,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'

/* ───────────────────────────────────────────────────────── */

function StatCard({ label, value, tone = 'slate' }) {
    const tones = {
        slate: 'text-slate-700 bg-slate-50 border-slate-200',
        amber: 'text-amber-700 bg-amber-50 border-amber-200',
        emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        rose: 'text-rose-700 bg-rose-50 border-rose-200',
    }
    return (
        <div className={`rounded-xl border ${tones[tone]} p-4`}>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</div>
            <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
    )
}

/* ───────────────────────────────────────────────────────── */

function UploadCard({ title, description, endpoint, templateHeaders, stats, onUploaded, accent = 'brand' }) {
    const { push } = useToastStore()
    const [busy, setBusy] = useState(false)
    const [replace, setReplace] = useState(false)
    const inputRef = useRef(null)

    const downloadTemplate = () => {
        const csv = templateHeaders.join(',') + '\n'
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const downloadLink = document.createElement('a')
        downloadLink.href = url
        downloadLink.download = 'template.csv'
        downloadLink.click()
        URL.revokeObjectURL(url)
    }

    const handleFile = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        setBusy(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('replace', String(replace))
            const res = await api.post(endpoint, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const imported = res.data?.data?.imported ?? 0
            push({ type: 'success', message: `Imported ${imported} rows` })
            onUploaded?.()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Upload failed' })
        } finally {
            setBusy(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const handleClear = async () => {
        if (!window.confirm('Clear the entire list? This cannot be undone.')) return
        setBusy(true)
        try {
            await api.delete(endpoint)
            push({ type: 'success', message: 'List cleared' })
            onUploaded?.()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to clear' })
        } finally {
            setBusy(false)
        }
    }

    return (
        <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                </div>
                {stats && (
                    <div className="flex gap-3 text-right text-xs">
                        <div>
                            <div className="font-bold text-slate-900">{stats.total ?? 0}</div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-400">Total</div>
                        </div>
                        <div>
                            <div className="font-bold text-emerald-600">{stats.claimed ?? 0}</div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-400">Claimed</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFile}
                    disabled={busy}
                    className="hidden"
                />
                <Button
                    type="button"
                    icon={busy ? Loader2 : Upload}
                    onClick={() => inputRef.current?.click()}
                    disabled={busy}
                >
                    {busy ? 'Uploading…' : 'Upload CSV'}
                </Button>

                <Button type="button" variant="secondary" icon={FileText} onClick={downloadTemplate} disabled={busy}>
                    Download template
                </Button>

                {stats && stats.total > 0 && (
                    <Button type="button" variant="secondary" icon={Trash2} onClick={handleClear} disabled={busy}>
                        Clear
                    </Button>
                )}
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <input
                    type="checkbox"
                    checked={replace}
                    onChange={(event) => setReplace(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                />
                Replace existing rows on upload
            </label>
        </Card>
    )
}

/* ───────────────────────────────────────────────────────── */

export default function Verification() {
    const { push } = useToastStore()
    const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0 })
    const [registryStats, setRegistryStats] = useState({ total: 0, unclaimed: 0, claimed: 0 })
    const [admittedStats, setAdmittedStats] = useState({ total: 0, unclaimed: 0, claimed: 0 })
    const [pending, setPending] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [actionId, setActionId] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const [statsResponse, registryResponse, admittedResponse, pendingResponse] = await Promise.all([
                api.get('/api/admin/verification/stats'),
                api.get('/api/admin/student-registry/stats'),
                api.get('/api/admin/admitted-students/stats'),
                api.get('/api/admin/verification/pending', {
                    params: { search: search || undefined, page: 0, size: 50 },
                }),
            ])
            setStats(statsResponse.data?.data || { pending: 0, verified: 0, rejected: 0 })
            setRegistryStats(registryResponse.data?.data || { total: 0, unclaimed: 0, claimed: 0 })
            setAdmittedStats(admittedResponse.data?.data || { total: 0, unclaimed: 0, claimed: 0 })
            setPending(pendingResponse.data?.data?.content || [])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])   // eslint-disable-line

    // Debounced search reload
    useEffect(() => {
        const searchTimeout = setTimeout(() => { load() }, 400)
        return () => clearTimeout(searchTimeout)
    }, [search])   // eslint-disable-line

    const approve = async (id) => {
        setActionId(id)
        try {
            await api.post(`/api/admin/verification/${id}/approve`)
            push({ type: 'success', message: 'User approved' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed' })
        } finally {
            setActionId(null)
        }
    }

    const reject = async (id) => {
        const reason = window.prompt('Reason for rejection (optional):')
        if (reason === null) return
        setActionId(id)
        try {
            await api.post(`/api/admin/verification/${id}/reject`, { reason })
            push({ type: 'success', message: 'User rejected' })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed' })
        } finally {
            setActionId(null)
        }
    }

    return (
        <div className="mx-auto max-w-5xl">
            

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <StatCard label="Pending" value={stats.pending} tone="amber" />
                <StatCard label="Verified" value={stats.verified} tone="emerald" />
                <StatCard label="Rejected" value={stats.rejected} tone="rose" />
            </div>

            {/* Upload panels */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <UploadCard
                    title="Student registry (continuing students)"
                    description="CSV with matric_number + full_name. Used to auto-verify continuing students."
                    endpoint="/api/admin/student-registry/upload"
                    templateHeaders={['matric_number', 'full_name', 'department', 'faculty', 'level']}
                    stats={registryStats}
                    onUploaded={load}
                />
                <UploadCard
                    title="Admission list (freshers)"
                    description="CSV with jamb_reg_number + full_name. Used to auto-verify freshers."
                    endpoint="/api/admin/admitted-students/upload"
                    templateHeaders={['jamb_reg_number', 'full_name', 'admission_ref', 'application_number', 'department']}
                    stats={admittedStats}
                    onUploaded={load}
                />
            </div>

            {/* Pending queue */}
            <Card className="mt-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-brand-600" />
                        <h3 className="text-base font-semibold text-slate-900">
                            Pending review
                        </h3>
                        {stats.pending > 0 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                {stats.pending}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name, email, matric…"
                                className="w-64 rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={load}
                            disabled={loading}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                            aria-label="Refresh"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {loading && pending.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                    </div>
                ) : pending.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        <p className="mt-3 text-sm font-medium text-slate-900">All caught up</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                            No registrations are waiting for review.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-500">
                                <th className="py-2 pr-3 font-semibold">Name</th>
                                <th className="py-2 pr-3 font-semibold">Email</th>
                                <th className="py-2 pr-3 font-semibold">Matric / JAMB</th>
                                <th className="py-2 pr-3 font-semibold">Type</th>
                                <th className="py-2 pr-3 font-semibold">Registered</th>
                                <th className="py-2 pr-3 font-semibold text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pending.map((pendingUser) => (
                                <tr key={pendingUser.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                                    <td className="py-2.5 pr-3 font-medium text-slate-900">{pendingUser.fullName}</td>
                                    <td className="py-2.5 pr-3 text-slate-600">{pendingUser.email}</td>
                                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">
                                        {pendingUser.matricNumber || pendingUser.jambRegNumber || '—'}
                                    </td>
                                    <td className="py-2.5 pr-3">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                pendingUser.role === 'FRESHER'
                                                    ? 'bg-sky-100 text-sky-700'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {pendingUser.role === 'FRESHER' ? 'Fresher' : 'Student'}
                                            </span>
                                    </td>
                                    <td className="py-2.5 pr-3 text-xs text-slate-500">
                                        {pendingUser.createdAt ? new Date(pendingUser.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="py-2.5 pr-3 text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => approve(pendingUser.id)}
                                                disabled={actionId === pendingUser.id}
                                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                {actionId === pendingUser.id
                                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                                    : <CheckCircle2 className="h-3 w-3" />}
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => reject(pendingUser.id)}
                                                disabled={actionId === pendingUser.id}
                                                className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
                                            >
                                                <XCircle className="h-3 w-3" />
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Help note */}
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <div>
                    The <strong>Matric verification mode</strong> in Settings determines what happens when a
                    student signs up. Set it to <em>Admission list</em> or <em>Both</em> to require a registry match,
                    or <em>Pattern only</em> to auto-queue anyone who hasn't been cross-checked.
                </div>
            </div>
        </div>
    )
}