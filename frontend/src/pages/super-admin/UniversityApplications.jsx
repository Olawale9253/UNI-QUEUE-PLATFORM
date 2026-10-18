import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Inbox, CheckCircle2, XCircle, Loader2, Building2, Mail, Phone, User as UserIcon,
    ChevronLeft, ChevronRight, X as CloseIcon,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import { useToastStore } from '../../store/toastStore'
import { formatTimeAgo } from '../../lib/format'

const FILTERS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: '', label: 'All' },
]

export default function UniversityApplications() {
    const { push } = useToastStore()
    const [apps, setApps] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('PENDING')
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [total, setTotal] = useState(0)
    const [actionId, setActionId] = useState(null)
    const [rejectTarget, setRejectTarget] = useState(null)
    const [rejectReason, setRejectReason] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('page', String(page))
            params.append('size', '25')
            if (filter) params.append('status', filter)
            const res = await api.get(`/api/super-admin/university-applications?${params.toString()}`)
            const data = res.data.data
            setApps(data.content || [])
            setTotalPages(data.totalPages || 0)
            setTotal(data.totalElements || 0)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load applications' })
        } finally {
            setLoading(false)
        }
    }, [filter, page, push])

    useEffect(() => { load() }, [load])

    useEffect(() => { setPage(0) }, [filter])

    const approve = async (app) => {
        setActionId(app.id)
        try {
            await api.post(`/api/super-admin/university-applications/${app.id}/approve`)
            push({ type: 'success', message: `${app.universityName} approved — setup email sent to ${app.adminEmail}` })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to approve' })
        } finally {
            setActionId(null)
        }
    }

    const reject = async () => {
        if (!rejectTarget) return
        setActionId(rejectTarget.id)
        try {
            await api.post(`/api/super-admin/university-applications/${rejectTarget.id}/reject`, {
                reason: rejectReason.trim() || null,
            })
            push({ type: 'success', message: 'Application rejected' })
            setRejectTarget(null)
            setRejectReason('')
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to reject' })
        } finally {
            setActionId(null)
        }
    }

    return (
        <>
            <PageHeader
                title="University Applications"
                description="Review requests from universities who want to join UniQueue."
            />

            <div className="mb-6 flex flex-wrap items-center gap-1.5">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        onClick={() => setFilter(f.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            filter === f.value
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                    {total} total
                </span>
            </div>

            {loading ? (
                <Card padded={false}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="border-b border-slate-100 p-6 dark:border-slate-800">
                            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                        </div>
                    ))}
                </Card>
            ) : apps.length === 0 ? (
                <EmptyState
                    icon={Inbox}
                    title="No applications"
                    description={filter === 'PENDING'
                        ? 'No pending applications right now. Nice.'
                        : 'No applications match this filter.'}
                />
            ) : (
                <div className="space-y-4">
                    {apps.map((app) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                                {app.universityName}
                                            </h3>
                                            <Badge variant="info">{app.universityCode}</Badge>
                                            <Badge variant={
                                                       app.status === 'PENDING' ? 'warning'
                                                           : app.status === 'APPROVED' ? 'success' : 'danger'
                                                   }>
                                                {app.status}
                                            </Badge>
                                        </div>

                                        <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-2 dark:text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <UserIcon className="h-3 w-3" />
                                                {app.adminFullName} {app.adminRole && `· ${app.adminRole}`}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Mail className="h-3 w-3" />
                                                {app.adminEmail}
                                            </span>
                                            {app.adminPhone && (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="h-3 w-3" />
                                                    {app.adminPhone}
                                                </span>
                                            )}
                                            {app.emailDomain && (
                                                <span className="flex items-center gap-1.5">
                                                    <Building2 className="h-3 w-3" />
                                                    {app.emailDomain}
                                                </span>
                                            )}
                                        </div>

                                        {app.message && (
                                            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                                                {app.message}
                                            </p>
                                        )}

                                        <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                                            Submitted {formatTimeAgo(app.createdAt)}
                                            {app.rejectionReason && (
                                                <> · Rejected: {app.rejectionReason}</>
                                            )}
                                        </div>
                                    </div>

                                    {app.status === 'PENDING' && (
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => approve(app)}
                                                loading={actionId === app.id}
                                                disabled={actionId === app.id}
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setRejectTarget(app)}
                                                disabled={actionId === app.id}
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={ChevronLeft}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        Page {page + 1} of {totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages - 1 || loading}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <AnimatePresence>
                {rejectTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Reject application?
                                </h3>
                                <button onClick={() => setRejectTarget(null)} className="rounded-md p-1 text-slate-400">
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                <strong>{rejectTarget.universityName}</strong> ({rejectTarget.adminEmail})
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                                placeholder="Reason (optional) — e.g., duplicate request"
                                className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                            <div className="mt-5 flex justify-end gap-2">
                                <Button variant="secondary" onClick={() => setRejectTarget(null)} disabled={actionId}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={reject}
                                    loading={actionId === rejectTarget.id}
                                    disabled={actionId === rejectTarget.id}
                                    className="bg-rose-600 hover:bg-rose-700"
                                >
                                    Reject
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}