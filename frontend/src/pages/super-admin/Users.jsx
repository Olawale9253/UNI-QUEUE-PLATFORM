import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Filter, X as CloseIcon, ChevronLeft, ChevronRight,
    User as UserIcon, Building2, Power, PowerOff, Mail, Users as UsersIcon, ShieldCheck
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ExportButton from '../../components/ui/ExportButton'
import ChangeRoleButton from '../../components/users/ChangeRoleButton'
import { useToastStore } from '../../store/toastStore'
import { formatDate } from '../../lib/format'
import { stagger, staggerItem } from '../../lib/motion'

const ROLE_OPTIONS = [
    { value: '', label: 'All roles' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'USER', label: 'Student (returning)' },
    { value: 'FRESHER', label: 'Fresher' },
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
                push({ type: 'error', message: err.message || 'Failed to load users' })
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
            push({ type: 'error', message: err.message || 'Failed' })
        } finally {
            setToggling(false)
        }
    }

    const handleRoleChanged = () => {
        loadUsers(page)
    }

    const activeFilterCount = Object.values(filters).filter(Boolean).length
    const universityOptions = universities.map((university) => ({
        value: university.id,
        label: `${university.code} · ${university.name}`,
    }))
    const universityById = new Map(universities.map((universityValue) => [universityValue.id, universityValue]))

    // Simple stats derived from the current view (or totalElements if available)
    const activeCount = users.filter(u => u.isActive).length
    const studentCount = users.filter(u => ['USER', 'FRESHER'].includes(u.role)).length

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        User Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage every user across every university on the platform.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton
                        rows={users}
                        columns={[
                            { key: 'id', label: 'ID' },
                            { key: 'fullName', label: 'Name' },
                            { key: 'email', label: 'Email' },
                            { key: 'role', label: 'Role' },
                            { key: 'universityCode', label: 'University' },
                            { key: 'isActive', label: 'Active' },
                        ]}
                        filename="uniqueue-users"
                        label="Export"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Users</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{totalElements}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-800/50">
                        <UsersIcon className="h-6 w-6" />
                    </div>
                </Card>
                <Card className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Students (page)</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{studentCount}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-slate-800/50">
                        <UserIcon className="h-6 w-6" />
                    </div>
                </Card>
                <Card className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active (page)</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{activeCount}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-slate-800/50">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                </Card>
            </div>

            {/* Search & Filters */}
            <Card>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <Input
                            placeholder="Search by name, email, or matric number…"
                            value={filters.search}
                            onChange={setFilter('search')}
                            icon={Search}
                        />
                    </div>
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

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 overflow-hidden border-t border-slate-100 pt-4 dark:border-slate-800"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Advanced Filters</h3>
                                {activeFilterCount > 0 && (
                                    <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700">
                                        <CloseIcon className="h-3.5 w-3.5" /> Clear all
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <Select label="University" value={filters.universityId} onChange={setFilter('universityId')} options={universityOptions} placeholder="All universities" />
                                <Select label="Role" value={filters.role} onChange={setFilter('role')} options={ROLE_OPTIONS} />
                                <Select label="Status" value={filters.isActive} onChange={setFilter('isActive')} options={STATUS_OPTIONS} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Users List */}
            <Card padded={false} className="overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-4 py-2">
                                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                                    <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <EmptyState
                        icon={UserIcon}
                        title="No users found"
                        description={activeFilterCount > 0 ? 'Try adjusting or clearing your filters.' : 'No users have registered yet.'}
                        action={activeFilterCount > 0 ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : undefined}
                    />
                ) : (
                    <motion.ul variants={stagger(0, 0.02)} initial="initial" animate="animate" className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map((user) => {
                            const uni = user.universityId ? universityById.get(user.universityId) : null
                            return (
                                <motion.li key={user.id} variants={staggerItem} className="flex flex-col gap-3 px-4 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 sm:flex-row sm:items-center sm:justify-between sm:px-6 transition-colors">
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-700">
                                            {user.fullName?.split(' ').map((parameter) => parameter[0]).slice(0, 2).join('')}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.fullName}</span>
                                                <Badge variant={roleVariant[user.role] || 'default'}>{String(user.role).replace('_', ' ')}</Badge>
                                                {!user.isActive && <Badge variant="danger">Disabled</Badge>}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</span>
                                                {uni && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{uni.code}</span>}
                                                {user.createdAt && <span>Joined {formatDate(user.createdAt)}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        <ChangeRoleButton user={user} onChanged={handleRoleChanged} variant="compact" />
                                        {user.role !== 'SUPER_ADMIN' && (
                                            <button
                                                onClick={() => setToggleTarget(user)}
                                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                                    user.isActive
                                                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                }`}
                                            >
                                                {user.isActive ? <><PowerOff className="h-4 w-4" /> Disable</> : <><Power className="h-4 w-4" /> Enable</>}
                                            </button>
                                        )}
                                    </div>
                                </motion.li>
                            )
                        })}
                    </motion.ul>
                )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => loadUsers(page - 1)} disabled={page === 0 || loading}>
                        Previous
                    </Button>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        Page {page + 1} of {totalPages}
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => loadUsers(page + 1)} disabled={page >= totalPages - 1 || loading}>
                        Next <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <ConfirmDialog
                open={!!toggleTarget}
                onClose={() => !toggling && setToggleTarget(null)}
                onConfirm={handleToggle}
                title={toggleTarget?.isActive ? `Disable ${toggleTarget?.fullName}?` : `Enable ${toggleTarget?.fullName}?`}
                description={toggleTarget?.isActive ? "They won't be able to log in or use the platform until re-enabled." : 'They will regain full access to their account.'}
                confirmLabel={toggleTarget?.isActive ? 'Disable' : 'Enable'}
                variant={toggleTarget?.isActive ? 'danger' : 'info'}
                loading={toggling}
            />
        </div>
    )
}