import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    Search,
    Filter,
    X as CloseIcon,
    ChevronLeft,
    ChevronRight,
    User as UserIcon,
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
import ChangeRoleButton from '../../components/users/ChangeRoleButton'
import { useToastStore } from '../../store/toastStore'
import { formatDate } from '../../lib/format'
import { stagger, staggerItem } from '../../lib/motion'

const ROLE_OPTIONS = [
    { value: '', label: 'All roles' },
    { value: 'USER', label: 'Student (returning)' },
    { value: 'FRESHER', label: 'Fresher' },
    { value: 'STAFF', label: 'Staff' },
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
    FRESHER: 'info',
}

// Roles an admin can assign — mirrors the backend allow-list.
const ADMIN_ASSIGNABLE_ROLES = ['USER', 'FRESHER', 'STAFF']

// Roles hidden from this page. Admins manage students & staff only.
const HIDDEN_ROLES = ['ADMIN', 'SUPER_ADMIN']

export default function Students() {
    const { push } = useToastStore()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)

    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const PAGE_SIZE = 25

    const [filters, setFilters] = useState({
        role: '',
        isActive: '',
        search: '',
    })

    const [toggleTarget, setToggleTarget] = useState(null)
    const [toggling, setToggling] = useState(false)

    const loadUsers = useCallback(
        async (pageToLoad = 0) => {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                params.append('page', String(pageToLoad))
                params.append('size', String(PAGE_SIZE))
                if (filters.role) params.append('role', filters.role)
                if (filters.isActive) params.append('isActive', filters.isActive)
                if (filters.search) params.append('search', filters.search)

                const res = await api.get(`/api/admin/users?${params.toString()}`)
                const data = res.data.data
                setUsers(data.content || [])
                setTotalPages(data.totalPages || 0)
                setTotalElements(data.totalElements || 0)
                setPage(pageToLoad)
            } catch (err) {
                push({
                    type: 'error',
                    message: err.message || 'Failed to load users',
                })
            } finally {
                setLoading(false)
            }
        },
        [filters, push]
    )

    useEffect(() => {
        loadUsers(0)
    }, [loadUsers])

    const clearFilters = () => {
        setFilters({ role: '', isActive: '', search: '' })
    }

    const setFilter = (field) => (event) =>
        setFilters({ ...filters, [field]: event.target.value })

    const handleToggle = async () => {
        if (!toggleTarget) return
        setToggling(true)
        try {
            const res = await api.post(`/api/admin/users/${toggleTarget.id}/toggle-active`)
            push({ type: 'success', message: res.data.message })
            setToggleTarget(null)
            await loadUsers(page)
        } catch (err) {
            push({
                type: 'error',
                message: err.message || 'Failed',
            })
        } finally {
            setToggling(false)
        }
    }

    const handleRoleChanged = () => {
        loadUsers(page)
    }

    const activeFilterCount = Object.values(filters).filter(Boolean).length

    // Hide admin accounts — this page is for students & staff only.
    const visibleUsers = useMemo(
        () => users.filter((u) => !HIDDEN_ROLES.includes(u.role)),
        [users]
    )
    const hiddenCount = users.length - visibleUsers.length

    return (
        <>
            <PageHeader
                title="Students & Staff"
                description="Everyone registered at your university."
                action={
                    <Button
                        variant={showFilters ? 'secondary' : 'primary'}
                        icon={Filter}
                        onClick={() => setShowFilters((areFiltersVisible) => !areFiltersVisible)}
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

            <div className="mb-4">
                <Input
                    placeholder="Search by name, email, or matric number…"
                    value={filters.search}
                    onChange={setFilter('search')}
                    icon={Search}
                />
            </div>

            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 overflow-hidden"
                >
                    <Card>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Filters
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

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <div className="mb-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>
                        {loading ? (
                            'Loading…'
                        ) : (
                            <>
                                <strong className="text-slate-900 dark:text-slate-100">
                                    {visibleUsers.length}
                                </strong>{' '}
                                {visibleUsers.length === 1 ? 'user' : 'users'} on this page
                                {activeFilterCount > 0 && ' (filtered)'}
                                {hiddenCount > 0 && (
                                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                                        · {hiddenCount} admin{hiddenCount === 1 ? '' : 's'} hidden
                                    </span>
                                )}
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

            {loading ? (
                <Card padded={false}>
                    {Array.from({ length: 8 }).map((unusedValue, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800"
                        >
                            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                            </div>
                        </div>
                    ))}
                </Card>
            ) : visibleUsers.length === 0 ? (
                <EmptyState
                    icon={UserIcon}
                    title="No users found"
                    description={
                        activeFilterCount > 0
                            ? 'Try adjusting or clearing your filters.'
                            : 'No students or staff have registered yet.'
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
                        {visibleUsers.map((user) => (
                            <motion.li
                                key={user.id}
                                variants={staggerItem}
                                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                            >
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-700">
                                        {user.fullName
                                            ?.split(' ')
                                            .map((namePart) => namePart[0])
                                            .slice(0, 2)
                                            .join('')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {user.fullName}
                                            </span>
                                            <Badge variant={roleVariant[user.role] || 'default'}>
                                                {String(user.role).replace('_', ' ')}
                                            </Badge>
                                            {user.registrationStatus === 'PENDING' && (
                                                <Badge variant="warning">Pending verify</Badge>
                                            )}
                                            {user.registrationStatus === 'REJECTED' && (
                                                <Badge variant="danger">Rejected</Badge>
                                            )}
                                            {!user.isActive && <Badge variant="danger">Disabled</Badge>}
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {user.email}
                                            </span>
                                            {user.matricNumber && (
                                                <span className="font-mono">{user.matricNumber}</span>
                                            )}
                                            {user.jambRegNumber && (
                                                <span className="font-mono">{user.jambRegNumber}</span>
                                            )}
                                            {user.createdAt && (
                                                <span>Joined {formatDate(user.createdAt)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1.5">
                                    <ChangeRoleButton
                                        user={user}
                                        onChanged={handleRoleChanged}
                                        variant="compact"
                                        endpoint="/api/admin/users"
                                        allowedRoles={ADMIN_ASSIGNABLE_ROLES}
                                    />

                                    {ADMIN_ASSIGNABLE_ROLES.includes(user.role) && (
                                        <button
                                            onClick={() => setToggleTarget(user)}
                                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                                user.isActive
                                                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
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
                        ))}
                    </motion.ul>
                </Card>
            )}

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
                    <span className="text-sm text-slate-600 dark:text-slate-400">
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