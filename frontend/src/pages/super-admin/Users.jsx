import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Search,
    Filter,
    X as CloseIcon,
    ChevronLeft,
    ChevronRight,
    User as UserIcon,
    Building2,
    Power,
    PowerOff,
    Mail,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/layout/PageHeader'
import ExportButton from '../../components/ui/ExportButton'
import { useToastStore } from '../../store/toastStore'
import { formatDate } from '../../lib/format'
import { stagger, staggerItem } from '../../lib/motion'

const ROLE_OPTIONS = [
    { value: '', label: 'All roles' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'USER', label: 'Student' },
]

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'true', label: 'Active only' },
    { value: 'false', label: 'Disabled only' },
]

const roleVariant = {
    SUPER_ADMIN: 'indigo',
    ADMIN: 'warning',
    STAFF: 'info',
    USER: 'success',
}

export default function Users() {
    const { push } = useToastStore()
    const [users, setUsers] = useState([])
    const [universities, setUniversities] = useState([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)

    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const PAGE_SIZE = 25

    const [filters, setFilters] = useState({
        universityId: '',
        role: '',
        isActive: '',
        search: '',
    })

    const [toggleTarget, setToggleTarget] = useState(null)
    const [toggling, setToggling] = useState(false)

    const loadUniversities = useCallback(async () => {
        try {
            const res = await api.get('/api/super-admin/universities')
            setUniversities(res.data.data || [])
        } catch {
            // silent
        }
    }, [])

    const loadUsers = useCallback(
        async (pageToLoad = 0) => {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('page', String(pageToLoad))
                params.append('size', String(PAGE_SIZE))
                if (filters.universityId) params.append('universityId', filters.universityId)
                if (filters.role) params.append('role', filters.role)
                if (filters.isActive) params.append('isActive', filters.isActive)
                if (filters.search) params.append('search', filters.search)

                const res = await api.get(`/api/super-admin/users?${params.toString()}`)
                const data = res.data.data
                setUsers(data.content || [])
                setTotalPages(data.totalPages || 0)
                setTotalElements(data.totalElements || 0)
                setPage(pageToLoad)
            } catch (err) {
                push({ type: 'error', message: err.response?.data?.message || 'Failed to load users' })
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
        loadUsers(0)
    }, [loadUsers])

    const clearFilters = () => {
        setFilters({ universityId: '', role: '', isActive: '', search: '' })
    }

    const setFilter = (field) => (event) => setFilters({ ...filters, [field]: event.target.value })

    const handleToggle = async () => {
        if (!toggleTarget) return
        setToggling(true)
        try {
            const res = await api.post(`/api/super-admin/users/${toggleTarget.id}/toggle-active`)
            push({ type: 'success', message: res.data.message })
            setToggleTarget(null)
            await loadUsers(page)
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed' })
        } finally {
            setToggling(false)
        }
    }

    const activeFilterCount = Object.values(filters).filter(Boolean).length
    const universityOptions = universities.map((university) => ({
        value: university.id,
        label: `${university.code} · ${university.name}`,
    }))
    const universityById = new Map(universities.map((universityValue) => [universityValue.id, universityValue]))

    return (
        <>
            <PageHeader
                title="All Users"
                description="Every user across every university on the platform."
                action={
                    <div className="flex items-center gap-2">
                        <ExportButton
                            rows={users}
                            columns={[
                                { key: 'id', label: 'ID' },
                                { key: 'fullName', label: 'Name' },
                                { key: 'email', label: 'Email' },
                                { key: 'role', label: 'Role' },
                                { key: 'universityCode', label: 'University' },
                                { key: 'matricNumber', label: 'Matric' },
                                { key: 'department', label: 'Department' },
                                { key: 'isActive', label: 'Active' },
                                { key: 'createdAt', label: 'Joined' },
                            ]}
                            filename="uniqueue-users"
                            label="Export page"
                        />
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
                    </div>
                }
            />

            {/* Search bar (always visible) */}
            <div className="mb-4">
                <Input
                    placeholder="Search by name, email, or matric number…"
                    value={filters.search}
                    onChange={setFilter('search')}
                    icon={Search}
                />
            </div>

            {/* Filters panel */}
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 overflow-hidden"
                >
                    <Card>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                                >
                                    <CloseIcon className="h-3.5 w-3.5" />
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Select
                                label="University"
                                value={filters.universityId}
                                onChange={setFilter('universityId')}
                                options={universityOptions}
                                placeholder="All universities"
                            />
                            <Select
                                label="Role"
                                value={filters.role}
                                onChange={setFilter('role')}
                                options={ROLE_OPTIONS}
                            />
                            <Select
                                label="Status"
                                value={filters.isActive}
                                onChange={setFilter('isActive')}
                                options={STATUS_OPTIONS}
                            />
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Summary */}
            <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>
            {loading ? (
                'Loading…'
            ) : (
                <>
                    <strong className="text-slate-900">{totalElements}</strong>{' '}
                    {totalElements === 1 ? 'user' : 'users'}
                    {activeFilterCount > 0 && ' (filtered)'}
                </>
            )}
          </span>
                </div>
                {totalPages > 1 && (
                    <span>
            Page {page + 1} of {totalPages}
          </span>
                )}
            </div>

            {/* Users list */}
            {loading ? (
                <Card padded={false}>
                    {Array.from({ length: 8 }).map((unusedValue, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 border-b border-slate-100 px-6 py-4"
                        >
                            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
                                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                            </div>
                        </div>
                    ))}
                </Card>
            ) : users.length === 0 ? (
                <EmptyState
                    icon={UserIcon}
                    title="No users found"
                    description={
                        activeFilterCount > 0
                            ? 'Try adjusting or clearing your filters.'
                            : 'No users have registered yet.'
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
                        {users.map((user) => {
                            const uni = user.universityId ? universityById.get(user.universityId) : null
                            return (
                                <motion.li
                                    key={user.id}
                                    variants={staggerItem}
                                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                                >
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                            {user.fullName?.split(' ').map((parameter) => parameter[0]).slice(0, 2).join('')}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {user.fullName}
                        </span>
                                                <Badge variant={roleVariant[user.role] || 'default'}>
                                                    {String(user.role).replace('_', ' ')}
                                                </Badge>
                                                {!user.isActive && (
                                                    <Badge variant="danger">Disabled</Badge>
                                                )}
                                            </div>

                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                            {user.email}
                        </span>
                                                {uni && (
                                                    <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                                                        {uni.code}
                          </span>
                                                )}
                                                {user.matricNumber && (
                                                    <span className="font-mono">{user.matricNumber}</span>
                                                )}
                                                {user.createdAt && (
                                                    <span>Joined {formatDate(user.createdAt)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {user.role !== 'SUPER_ADMIN' && (
                                            <button
                                                onClick={() => setToggleTarget(user)}
                                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                                    user.isActive
                                                        ? 'text-rose-600 hover:bg-rose-50'
                                                        : 'text-emerald-600 hover:bg-emerald-50'
                                                }`}
                                            >
                                                {user.isActive ? (
                                                    <>
                                                        <PowerOff className="h-3.5 w-3.5" />
                                                        Disable
                                                    </>
                                                ) : (
                                                    <>
                                                        <Power className="h-3.5 w-3.5" />
                                                        Enable
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </motion.li>
                            )
                        })}
                    </motion.ul>
                </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={ChevronLeft}
                        onClick={() => loadUsers(page - 1)}
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
                        onClick={() => loadUsers(page + 1)}
                        disabled={page >= totalPages - 1 || loading}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Toggle confirmation */}
            <ConfirmDialog
                open={!!toggleTarget}
                onClose={() => !toggling && setToggleTarget(null)}
                onConfirm={handleToggle}
                title={
                    toggleTarget?.isActive
                        ? `Disable ${toggleTarget?.fullName}?`
                        : `Enable ${toggleTarget?.fullName}?`
                }
                description={
                    toggleTarget?.isActive
                        ? "They won't be able to log in or use the platform until re-enabled."
                        : 'They will regain full access to their account.'
                }
                confirmLabel={toggleTarget?.isActive ? 'Disable' : 'Enable'}
                variant={toggleTarget?.isActive ? 'danger' : 'info'}
                loading={toggling}
            />
        </>
    )
}