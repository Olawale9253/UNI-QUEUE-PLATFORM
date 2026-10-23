import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    History, Filter, X as CloseIcon, ChevronLeft, ChevronRight,
    Activity, Eye, CheckCircle2, XCircle, Info, User as UserIcon, Cpu, Search
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ExportButton from '../../components/ui/ExportButton'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime, formatTimeAgo } from '../../lib/format'
import { stagger, staggerItem } from '../../lib/motion'

const ACTION_GROUPS = [
    { label: 'Authentication', actions: ['USER_REGISTERED', 'USER_LOGIN', 'USER_LOGIN_FAILED'] },
    { label: 'Tickets', actions: ['TICKET_JOINED', 'TICKET_WAITLISTED', 'TICKET_WAITLIST_PROMOTED', 'TICKET_CALLED', 'TICKET_SERVED', 'TICKET_COMPLETED', 'TICKET_NO_SHOW', 'TICKET_TRANSFERRED', 'TICKET_CANCELLED', 'TICKET_PRIORITY_CHANGED'] },
    { label: 'Queues', actions: ['QUEUE_CREATED', 'QUEUE_UPDATED', 'QUEUE_DELETED'] },
    { label: 'Staff', actions: ['STAFF_CREATED', 'STAFF_ASSIGNED', 'STAFF_UNASSIGNED'] },
    { label: 'Universities', actions: ['UNIVERSITY_CREATED', 'UNIVERSITY_UPDATED', 'UNIVERSITY_DEACTIVATED', 'UNIVERSITY_REACTIVATED', 'ADMIN_CREATED'] },
    { label: 'Feedback', actions: ['FEEDBACK_SUBMITTED'] },
    { label: 'Documents', actions: ['DOCUMENT_UPLOADED', 'DOCUMENT_DELETED'] },
    { label: 'Appointments', actions: ['APPOINTMENT_SLOT_CREATED', 'APPOINTMENT_SLOT_UPDATED', 'APPOINTMENT_SLOT_DELETED', 'APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_COMPLETED', 'APPOINTMENT_NO_SHOW'] },
    { label: 'Workflows', actions: ['WORKFLOW_CREATED', 'WORKFLOW_UPDATED', 'WORKFLOW_DELETED', 'WORKFLOW_STARTED', 'WORKFLOW_STEP_COMPLETED', 'WORKFLOW_COMPLETED', 'WORKFLOW_ABANDONED'] },
]

function actionVariant(action) {
    if (!action) return 'default'
    if (action.includes('FAILED') || action.includes('DEACTIVATED') || action.includes('DELETED')) return 'danger'
    if (action.includes('COMPLETED') || action.includes('CREATED') || action.includes('LOGIN')) return 'success'
    if (action.startsWith('TICKET') || action.startsWith('WORKFLOW')) return 'indigo'
    if (action.startsWith('UNIVERSITY') || action.startsWith('ADMIN')) return 'warning'
    return 'default'
}

function getActionStyle(action) {
    if (!action) return { icon: Info, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800 dark:text-slate-300' }
    if (action.includes('FAILED') || action.includes('DELETED') || action.includes('DEACTIVATED')) {
        return { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' }
    }
    if (action.includes('COMPLETED') || action.includes('CREATED') || action.includes('LOGIN') || action.includes('ASSIGNED')) {
        return { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' }
    }
    return { icon: Info, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40' }
}

function parseDetails(details) {
    if (!details) return null
    try {
        let parsed = typeof details === 'string' ? JSON.parse(details) : details
        if (typeof parsed === 'string') parsed = JSON.parse(parsed)
        return parsed
    } catch {
        return details
    }
}

export default function AuditLogs() {
    const { push } = useToastStore()
    const [logs, setLogs] = useState([])
    const [universities, setUniversities] = useState([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [selectedLog, setSelectedLog] = useState(null)

    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const PAGE_SIZE = 30

    const [filters, setFilters] = useState({
        universityId: '',
        action: '',
        from: '',
        to: '',
    })

    const loadUniversities = useCallback(async () => {
        try {
            const res = await api.get('/api/super-admin/universities')
            setUniversities(res.data.data || [])
        } catch {
            // silent
        }
    }, [])

    const loadLogs = useCallback(
        async (pageToLoad = 0) => {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('page', String(pageToLoad))
                params.append('size', String(PAGE_SIZE))
                if (filters.universityId) params.append('universityId', filters.universityId)
                if (filters.action) params.append('action', filters.action)
                if (filters.from) params.append('from', new Date(filters.from).toISOString())
                if (filters.to) params.append('to', new Date(filters.to).toISOString())

                const res = await api.get(`/api/super-admin/audit-logs?${params.toString()}`)
                const data = res.data.data
                setLogs(data.content || [])
                setTotalPages(data.totalPages || 0)
                setTotalElements(data.totalElements || 0)
                setPage(pageToLoad)
            } catch (err) {
                push({ type: 'error', message: err.message || 'Failed to load audit logs' })
            } finally {
                setLoading(false)
            }
        },
        [filters, push]
    )

    useEffect(() => { loadUniversities() }, [loadUniversities])
    useEffect(() => { loadLogs(0) }, [loadLogs])

    const clearFilters = () => setFilters({ universityId: '', action: '', from: '', to: '' })
    const setFilter = (field) => (event) => setFilters({ ...filters, [field]: event.target.value })

    const universityOptions = universities.map((university) => ({
        value: university.id,
        label: `${university.code} · ${university.name}`,
    }))

    const activeFilterCount = Object.values(filters).filter(Boolean).length
    const universityById = new Map(universities.map((universityValue) => [universityValue.id, universityValue]))

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Platform Audit Logs
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Every action across all universities recorded in real-time.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton
                        rows={logs}
                        columns={[
                            { key: 'id', label: 'ID' },
                            { key: 'createdAt', label: 'Date & Time' },
                            { key: 'action', label: 'Activity' },
                            { key: 'entityType', label: 'Target Type' },
                            { key: 'entityId', label: 'Target ID' },
                            { key: 'userId', label: 'User ID' },
                            { key: 'universityId', label: 'University' },
                            { key: 'ipAddress', label: 'IP Address' },
                        ]}
                        filename="uniqueue-super-admin-audit-logs"
                        label="Export"
                    />
                    <Button
                        variant={showFilters ? 'secondary' : 'primary'}
                        icon={Filter}
                        onClick={() => setShowFilters((prev) => !prev)}
                    >
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <Card>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filter Logs</h3>
                                {activeFilterCount > 0 && (
                                    <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700">
                                        <CloseIcon className="h-3.5 w-3.5" /> Clear all
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Select label="University" value={filters.universityId} onChange={setFilter('universityId')} options={universityOptions} placeholder="All universities" />
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Activity Type</label>
                                    <select value={filters.action} onChange={setFilter('action')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                        <option value="">All actions</option>
                                        {ACTION_GROUPS.map((item) => (
                                            <optgroup key={item.label} label={item.label}>
                                                {item.actions.map((itemValue) => (<option key={itemValue} value={itemValue}>{itemValue.replace(/_/g, ' ')}</option>))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <Input label="From" type="datetime-local" value={filters.from} onChange={setFilter('from')} />
                                <Input label="To" type="datetime-local" value={filters.to} onChange={setFilter('to')} />
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Count */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Activity className="h-4 w-4" />
                <span>
                    {loading ? 'Loading records…' : (
                        <>
                            <strong className="text-slate-900 dark:text-slate-100">{totalElements}</strong>{' '}
                            {totalElements === 1 ? 'record' : 'records'} found
                            {activeFilterCount > 0 && ' (filtered)'}
                        </>
                    )}
                </span>
            </div>

            {/* Table */}
            {loading ? (
                <Card padded={false}>
                    {Array.from({ length: 8 }).map((unusedValue, index) => (
                        <div key={index} className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                            </div>
                        </div>
                    ))}
                </Card>
            ) : logs.length === 0 ? (
                <EmptyState icon={History} title="No audit logs found" description={activeFilterCount > 0 ? 'Try adjusting or clearing your filters.' : 'Once users perform actions, they will appear here.'} action={activeFilterCount > 0 ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : undefined} />
            ) : (
                <Card padded={false} className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/50">
                            <tr>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date & Time</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Activity</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Target</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Performed By</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">IP Address</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Details</th>
                            </tr>
                            </thead>
                            <motion.tbody variants={stagger(0, 0.02)} initial="initial" animate="animate" className="divide-y divide-slate-100 dark:divide-slate-800">
                                {logs.map((log) => {
                                    const style = getActionStyle(log.action)
                                    const Icon = style.icon
                                    const uni = log.universityId ? universityById.get(log.universityId) : null
                                    return (
                                        <motion.tr key={log.id} variants={staggerItem} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                {formatDateTime(log.createdAt)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${style.bg} ${style.color}`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {String(log.action).replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {log.entityType ? (
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300">
                                                        {log.entityType} {log.entityId}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {log.userId ? (
                                                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                                                            User {log.userId}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 dark:text-sky-400">
                                                            <Cpu className="h-3.5 w-3.5" />
                                                            System
                                                        </span>
                                                    )}
                                                    {uni && (
                                                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                                            {uni.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                                                {log.ipAddress || '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right">
                                                {log.details ? (
                                                    <button onClick={() => setSelectedLog(log)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                                                        <Eye className="h-3.5 w-3.5" /> View
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400">No details</span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </motion.tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => loadLogs(page - 1)} disabled={page === 0 || loading}>Previous</Button>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Page {page + 1} of {totalPages}</span>
                    <Button variant="secondary" size="sm" onClick={() => loadLogs(page + 1)} disabled={page >= totalPages - 1 || loading}>Next <ChevronRight className="h-4 w-4" /></Button>
                </div>
            )}

            {/* Details Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Event Details</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{String(selectedLog.action).replace(/_/g, ' ')}</p>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <CloseIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-5">
                                <pre className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                                    {typeof parseDetails(selectedLog.details) === 'object' ? JSON.stringify(parseDetails(selectedLog.details), null, 2) : parseDetails(selectedLog.details)}
                                </pre>
                            </div>
                            <div className="border-t border-slate-100 p-4 text-right dark:border-slate-800">
                                <Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}