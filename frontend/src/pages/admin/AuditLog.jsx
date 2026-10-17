import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    History,
    Filter,
    X as CloseIcon,
    ChevronLeft,
    ChevronRight,
    Activity,
    LogIn,
    UserPlus,
    Trash2,
    PlusCircle,
    ShieldAlert,
    KeyRound,
    Building2,
    ListOrdered,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import ExportButton from '../../components/ui/ExportButton'
import { useToastStore } from '../../store/toastStore'
import { formatTimeAgo, formatDateTime } from '../../lib/format'
import { stagger, staggerItem } from '../../lib/motion'

const ACTION_GROUPS = [
    {
        label: 'Authentication',
        actions: ['USER_REGISTERED', 'USER_LOGIN', 'USER_LOGIN_FAILED'],
    },
    {
        label: 'Tickets',
        actions: [
            'TICKET_JOINED', 'TICKET_WAITLISTED', 'TICKET_WAITLIST_PROMOTED',
            'TICKET_CALLED', 'TICKET_SERVED', 'TICKET_COMPLETED',
            'TICKET_NO_SHOW', 'TICKET_TRANSFERRED', 'TICKET_CANCELLED',
            'TICKET_PRIORITY_CHANGED', 'TICKET_RESCHEDULED', 'TICKET_SKIPPED',
        ],
    },
    {
        label: 'Queues',
        actions: ['QUEUE_CREATED', 'QUEUE_UPDATED', 'QUEUE_DELETED'],
    },
    {
        label: 'Staff',
        actions: ['STAFF_CREATED', 'STAFF_ASSIGNED', 'STAFF_UNASSIGNED'],
    },
    { label: 'Feedback', actions: ['FEEDBACK_SUBMITTED'] },
    { label: 'Documents', actions: ['DOCUMENT_UPLOADED', 'DOCUMENT_DELETED'] },
    {
        label: 'Appointments',
        actions: [
            'APPOINTMENT_SLOT_CREATED', 'APPOINTMENT_SLOT_UPDATED', 'APPOINTMENT_SLOT_DELETED',
            'APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_COMPLETED', 'APPOINTMENT_NO_SHOW',
        ],
    },
    {
        label: 'Workflows',
        actions: [
            'WORKFLOW_CREATED', 'WORKFLOW_UPDATED', 'WORKFLOW_DELETED',
            'WORKFLOW_STARTED', 'WORKFLOW_STEP_COMPLETED', 'WORKFLOW_COMPLETED', 'WORKFLOW_ABANDONED',
        ],
    },
]

// ── Naming & Icon Helpers ──
function formatActionName(action) {
    if (!action) return 'Unknown Action'
    return action
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getActionIcon(action) {
    if (action.includes('LOGIN') || action.includes('PASSWORD')) return KeyRound
    if (action.includes('REGISTERED') || action.includes('STAFF_CREATED')) return UserPlus
    if (action.includes('DELETED') || action.includes('FAILED')) return Trash2
    if (action.includes('CREATED')) return PlusCircle
    if (action.includes('QUEUE') || action.includes('TICKET')) return ListOrdered
    if (action.includes('UNIVERSITY') || action.includes('OFFICE')) return Building2
    if (action.includes('WORKFLOW') || action.includes('APPOINTMENT')) return Activity
    return Activity
}

function getActionColor(action) {
    if (!action) return 'default'
    if (action.includes('FAILED') || action.includes('DELETED') || action.includes('DEACTIVATED')) {
        return 'danger'
    }
    if (action.includes('LOGIN') || action.includes('REGISTERED')) {
        return 'success'
    }
    if (action.includes('CREATED') || action.includes('COMPLETED')) {
        return 'indigo'
    }
    if (action.includes('UPDATED') || action.includes('ASSIGNED')) {
        return 'warning'
    }
    return 'default'
}

// ── JSON Prettifier ──
function parseDetails(details) {
    if (!details) return null
    try {
        // Some logs might be double stringified
        let parsed = typeof details === 'string' ? JSON.parse(details) : details
        if (typeof parsed === 'string') parsed = JSON.parse(parsed)
        return parsed
    } catch {
        return details // Return raw string if it's not valid JSON
    }
}

export default function AuditLog() {
    const { push } = useToastStore()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)

    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const PAGE_SIZE = 30

    const [filters, setFilters] = useState({
        action: '',
        from: '',
        to: '',
    })

    const loadLogs = useCallback(
        async (pageToLoad = 0) => {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('page', String(pageToLoad))
                params.append('size', String(PAGE_SIZE))
                if (filters.action) params.append('action', filters.action)
                if (filters.from) params.append('from', new Date(filters.from).toISOString())
                if (filters.to) params.append('to', new Date(filters.to).toISOString())

                const res = await api.get(`/api/admin/audit-logs?${params.toString()}`)
                const data = res.data.data
                setLogs(data.content || [])
                setTotalPages(data.totalPages || 0)
                setTotalElements(data.totalElements || 0)
                setPage(pageToLoad)
            } catch (err) {
                push({
                    type: 'error',
                    message: err.response?.data?.message || 'Failed to load audit logs',
                })
            } finally {
                setLoading(false)
            }
        },
        [filters, push]
    )

    useEffect(() => {
        loadLogs(0)
    }, [loadLogs])

    const clearFilters = () => {
        setFilters({ action: '', from: '', to: '' })
    }

    const setFilter = (field) => (event) => setFilters({ ...filters, [field]: event.target.value })

    const activeFilterCount = Object.values(filters).filter(Boolean).length

    return (
        <>
            <PageHeader
                title="Audit Logs"
                description="Every meaningful action recorded at your university."
                action={
                    <Button
                        variant={showFilters ? 'secondary' : 'primary'}
                        icon={Filter}
                        onClick={() => setShowFilters((setShowFilter) => !setShowFilter)}
                    >
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                }
            />

            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 overflow-hidden"
                >
                    <Card>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Filter logs
                            </h3>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400"
                                >
                                    <CloseIcon className="h-3.5 w-3.5" />
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Action
                                </label>
                                <select
                                    value={filters.action}
                                    onChange={setFilter('action')}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                >
                                    <option value="">All actions</option>
                                    {ACTION_GROUPS.map((item) => (
                                        <optgroup key={item.label} label={item.label}>
                                            {item.actions.map((itemValue) => (
                                                <option key={itemValue} value={itemValue}>
                                                    {formatActionName(itemValue)}
                                                </option>
                                            ))}
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

            <div className="mb-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span>
                            {loading ? (
                                'Loading…'
                            ) : (
                                <>
                                    <strong className="text-slate-900 dark:text-slate-100">{totalElements}</strong>{' '}
                                    {totalElements === 1 ? 'entry' : 'entries'}
                                    {activeFilterCount > 0 && ' (filtered)'}
                                </>
                            )}
                        </span>
                    </div>
                    <ExportButton
                        rows={logs}
                        columns={[
                            { key: 'id', label: 'ID' },
                            { key: 'action', label: 'Action' },
                            { key: 'entityType', label: 'Entity Type' },
                            { key: 'entityId', label: 'Entity ID' },
                            { key: 'userId', label: 'User ID' },
                            { key: 'ipAddress', label: 'IP Address' },
                            { key: 'details', label: 'Details' },
                            { key: 'createdAt', label: 'Timestamp' },
                        ]}
                        filename="uniqueue-audit-logs"
                        label="Export page"
                    />
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <span>Page {page + 1} of {totalPages}</span>
                    </div>
                )}
            </div>

            {loading ? (
                <Card padded={false}>
                    {Array.from({ length: 8 }).map((unusedValue, index) => (
                        <div key={index} className="flex items-center gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                            </div>
                        </div>
                    ))}
                </Card>
            ) : logs.length === 0 ? (
                <EmptyState
                    icon={History}
                    title="No audit logs found"
                    description={
                        activeFilterCount > 0
                            ? 'Try adjusting or clearing your filters.'
                            : 'Once users perform actions, they will appear here.'
                    }
                    action={
                        activeFilterCount > 0 ? (
                            <Button variant="secondary" onClick={clearFilters}>
                                Clear filters
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <Card padded={false}>
                    <motion.ul
                        variants={stagger(0, 0.02)}
                        initial="initial"
                        animate="animate"
                        className="divide-y divide-slate-100 dark:divide-slate-800"
                    >
                        {logs.map((log) => {
                            const Icon = getActionIcon(log.action)
                            const variant = getActionColor(log.action)
                            const parsedDetails = parseDetails(log.details)

                            return (
                                <motion.li
                                    key={log.id}
                                    variants={staggerItem}
                                    className="group relative flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 sm:flex-row sm:items-start sm:p-6"
                                >
                                    {/* Icon Column */}
                                    <div className="flex shrink-0 items-center justify-center sm:items-start pt-1">
                                        <div className="relative">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 bg-${variant === 'default' ? 'slate' : variant}-50 text-${variant === 'default' ? 'slate' : variant}-600 dark:bg-${variant === 'default' ? 'slate' : variant}-950/50 dark:text-${variant === 'default' ? 'slate' : variant}-400`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            {/* Timeline line */}
                                            <div className="absolute top-10 left-1/2 -ml-px h-full w-0.5 bg-slate-100 dark:bg-slate-800 group-last:hidden" />
                                        </div>
                                    </div>

                                    {/* Content Column */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant={variant} className="uppercase tracking-wide text-[10px]">
                                                    {formatActionName(log.action)}
                                                </Badge>
                                                {log.entityType && (
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col text-left sm:text-right text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-medium text-slate-900 dark:text-slate-300">
                                                    {formatTimeAgo(log.createdAt)}
                                                </span>
                                                <span title={formatDateTime(log.createdAt)}>
                                                    {formatDateTime(log.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            {log.userId && (
                                                <span className="flex items-center gap-1.5">
                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold">
                                                        U
                                                    </div>
                                                    User #{log.userId}
                                                </span>
                                            )}
                                            {log.ipAddress && (
                                                <span className="flex items-center gap-1 font-mono text-[11px]">
                                                    IP: {log.ipAddress}
                                                </span>
                                            )}
                                        </div>

                                        {/* Formatted Details */}
                                        {parsedDetails && (
                                            <div className="mt-3">
                                                {typeof parsedDetails === 'object' ? (
                                                    <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                                        {JSON.stringify(parsedDetails, null, 2)}
                                                    </pre>
                                                ) : (
                                                    <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                                        {parsedDetails}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.li>
                            )
                        })}
                    </motion.ul>
                </Card>
            )}

            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={ChevronLeft}
                        onClick={() => loadLogs(page - 1)}
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
                        onClick={() => loadLogs(page + 1)}
                        disabled={page >= totalPages - 1 || loading}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </>
    )
}