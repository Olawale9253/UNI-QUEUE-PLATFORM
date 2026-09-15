import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    History,
    Filter,
    X,
    ChevronLeft,
    ChevronRight,
    User as UserIcon,
    Building2,
    Activity,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import ExportButton from '../../components/ui/ExportButton'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime, formatTimeAgo } from '../../lib/format'
import { stagger, staggerItem } from '../../lib/motion'

const ACTION_GROUPS = [
    {
        label: 'Authentication',
        actions: ['USER_REGISTERED', 'USER_LOGIN', 'USER_LOGIN_FAILED'],
    },
    {
        label: 'Tickets',
        actions: [
            'TICKET_JOINED',
            'TICKET_WAITLISTED',
            'TICKET_WAITLIST_PROMOTED',
            'TICKET_CALLED',
            'TICKET_SERVED',
            'TICKET_COMPLETED',
            'TICKET_NO_SHOW',
            'TICKET_TRANSFERRED',
            'TICKET_CANCELLED',
            'TICKET_PRIORITY_CHANGED',
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
    {
        label: 'Universities',
        actions: [
            'UNIVERSITY_CREATED',
            'UNIVERSITY_UPDATED',
            'UNIVERSITY_DEACTIVATED',
            'UNIVERSITY_REACTIVATED',
            'ADMIN_CREATED',
        ],
    },
    { label: 'Feedback', actions: ['FEEDBACK_SUBMITTED'] },
    { label: 'Documents', actions: ['DOCUMENT_UPLOADED', 'DOCUMENT_DELETED'] },
    {
        label: 'Appointments',
        actions: [
            'APPOINTMENT_SLOT_CREATED',
            'APPOINTMENT_SLOT_UPDATED',
            'APPOINTMENT_SLOT_DELETED',
            'APPOINTMENT_BOOKED',
            'APPOINTMENT_CANCELLED',
            'APPOINTMENT_COMPLETED',
            'APPOINTMENT_NO_SHOW',
        ],
    },
    {
        label: 'Workflows',
        actions: [
            'WORKFLOW_CREATED',
            'WORKFLOW_UPDATED',
            'WORKFLOW_DELETED',
            'WORKFLOW_STARTED',
            'WORKFLOW_STEP_COMPLETED',
            'WORKFLOW_COMPLETED',
            'WORKFLOW_ABANDONED',
        ],
    },
]

function actionVariant(action) {
    if (!action) return 'default'
    if (
        action.includes('FAILED') ||
        action.includes('DEACTIVATED') ||
        action.includes('DELETED')
    )
        return 'danger'
    if (
        action.includes('COMPLETED') ||
        action.includes('CREATED') ||
        action.includes('LOGIN')
    )
        return 'success'
    if (action.startsWith('TICKET') || action.startsWith('WORKFLOW')) return 'indigo'
    if (action.startsWith('UNIVERSITY') || action.startsWith('ADMIN')) return 'warning'
    return 'default'
}

export default function AuditLogs() {
    const { push } = useToastStore()
    const [logs, setLogs] = useState([])
    const [universities, setUniversities] = useState([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)

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
        loadUniversities()
    }, [loadUniversities])

    useEffect(() => {
        loadLogs(0)
    }, [loadLogs])

    const clearFilters = () => {
        setFilters({ universityId: '', action: '', from: '', to: '' })
    }

    const setFilter = (field) => (e) => setFilters({ ...filters, [field]: e.target.value })

    const universityOptions = universities.map((u) => ({
        value: u.id,
        label: `${u.code} · ${u.name}`,
    }))

    const activeFilterCount = Object.values(filters).filter(Boolean).length
    const universityById = new Map(universities.map((u) => [u.id, u]))

    return (
        <>
            <PageHeader
                title="Audit Logs"
                description="Every meaningful action recorded across the platform."
                action={
                    <Button
                        variant={showFilters ? 'secondary' : 'primary'}
                        icon={Filter}
                        onClick={() => setShowFilters((v) => !v)}
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
                            <h3 className="text-sm font-semibold text-slate-900">Filter logs</h3>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Select
                                label="University"
                                value={filters.universityId}
                                onChange={setFilter('universityId')}
                                options={universityOptions}
                                placeholder="All universities"
                            />

                            <div className="mb-4">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Action
                                </label>
                                <select
                                    value={filters.action}
                                    onChange={setFilter('action')}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                                >
                                    <option value="">All actions</option>
                                    {ACTION_GROUPS.map((g) => (
                                        <optgroup key={g.label} label={g.label}>
                                            {g.actions.map((a) => (
                                                <option key={a} value={a}>
                                                    {a.replace(/_/g, ' ')}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label="From"
                                type="datetime-local"
                                value={filters.from}
                                onChange={setFilter('from')}
                            />
                            <Input
                                label="To"
                                type="datetime-local"
                                value={filters.to}
                                onChange={setFilter('to')}
                            />
                        </div>
                    </Card>
                </motion.div>
            )}

            <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span>
              {loading ? (
                  'Loading…'
              ) : (
                  <>
                      <strong className="text-slate-900">{totalElements}</strong>{' '}
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
                            { key: 'universityId', label: 'University ID' },
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
            <span>
              Page {page + 1} of {totalPages}
            </span>
                    </div>
                )}
            </div>

            {loading ? (
                <Card padded={false}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 border-b border-slate-100 px-6 py-4"
                        >
                            <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
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
                        className="divide-y divide-slate-100"
                    >
                        {logs.map((log) => {
                            const uni = log.universityId ? universityById.get(log.universityId) : null
                            return (
                                <motion.li
                                    key={log.id}
                                    variants={staggerItem}
                                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                                >
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                            <Activity className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant={actionVariant(log.action)}>
                                                    {String(log.action).replace(/_/g, ' ')}
                                                </Badge>
                                                {log.entityType && (
                                                    <span className="text-xs text-slate-500">
                            {log.entityType}
                                                        {log.entityId ? ` #${log.entityId}` : ''}
                          </span>
                                                )}
                                            </div>

                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                                {log.userId && (
                                                    <span className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            User #{log.userId}
                          </span>
                                                )}
                                                {uni && (
                                                    <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                                                        {uni.code}
                          </span>
                                                )}
                                                {log.ipAddress && (
                                                    <span className="font-mono">{log.ipAddress}</span>
                                                )}
                                            </div>

                                            {log.details && (
                                                <div className="mt-1.5 truncate rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600">
                                                    {log.details}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="ml-12 shrink-0 text-xs text-slate-500 sm:ml-0 sm:text-right">
                                        <div className="font-medium text-slate-700">
                                            {formatTimeAgo(log.createdAt)}
                                        </div>
                                        <div>{formatDateTime(log.createdAt)}</div>
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
                    <span className="text-sm text-slate-600">
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