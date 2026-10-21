import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Activity, Users, ListOrdered, Clock, RefreshCw, AlertTriangle,
    Search, Building2, TrendingUp, Filter,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ExportButton from '../../components/ui/ExportButton'
import { SkeletonBox, SkeletonSettingsCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { useAdaptivePoll } from '../../hooks/useAdaptivePoll'

const LEVEL_STYLES = {
    LOW: {
        chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
        bar: 'bg-emerald-500',
        label: 'Low load',
    },
    MEDIUM: {
        chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
        bar: 'bg-amber-500',
        label: 'Moderate',
    },
    HIGH: {
        chip: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900',
        bar: 'bg-orange-500',
        label: 'High load',
    },
    CRITICAL: {
        chip: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
        bar: 'bg-rose-500',
        label: 'Critical',
    },
}

function levelStyle(level) {
    return LEVEL_STYLES[level] || LEVEL_STYLES.LOW
}

function formatHours(minutes) {
    if (!minutes || minutes <= 0) return '—'
    if (minutes < 60) return `${minutes} min`
    const MathValue = Math.floor(minutes / 60)
    const message = minutes % 60
    return message > 0 ? `${MathValue}h ${message}m` : `${MathValue}h`
}

function WorkloadSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((unusedValue, index) => (
                    <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <SkeletonBox className="h-3 w-20" />
                        <SkeletonBox className="mt-3 h-7 w-16" />
                        <SkeletonBox className="mt-2 h-3 w-24" />
                    </div>
                ))}
            </div>
            <SkeletonSettingsCard />
            <SkeletonSettingsCard />
        </div>
    )
}

function SummaryTile({ label, value, hint, icon: Icon, accent, valueColor }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {label}
                        </div>
                        <div className={`mt-2 text-3xl font-bold tracking-tight ${valueColor}`}>
                            {value}
                        </div>
                        {hint && (
                            <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                {hint}
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    )
}

function QueueRow({ q: queue, showRatioBar }) {
    const stringValue = levelStyle(queue.level)
    return (
        <div className="grid grid-cols-12 items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800">
            <div className="col-span-4 min-w-0">
                <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {queue.queueName}
                </div>
                {!queue.isOpen && (
                    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Closed
                    </div>
                )}
            </div>

            <div className="col-span-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {queue.waitingCount}
            </div>

            <div className="col-span-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {queue.staffCount}
            </div>

            <div className="col-span-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {queue.ratio.toFixed(1)}
                    </span>
                    {showRatioBar && (
                        <div className="h-1.5 w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className={`h-full ${stringValue.bar}`}
                                style={{
                                    width: `${Math.min(100, (queue.ratio / 20) * 100)}%`,
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="col-span-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                {formatHours(queue.estWaitMinutes)}
            </div>
        </div>
    )
}

function OfficeCard({ office }) {
    const stringValueValue = levelStyle(office.level)
    const criticalQueues = office.queues.filter(
        (item) => item.level === 'CRITICAL' || item.level === 'HIGH'
    ).length

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card padded={false}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <div className="flex min-w-0 items-start gap-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${stringValueValue.chip}`}
                        >
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                                {office.officeName}
                            </h3>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                                <span>
                                    {office.queueCount}{' '}
                                    {office.queueCount === 1 ? 'service' : 'services'}
                                </span>
                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                <span>
                                    Ratio{' '}
                                    <strong className="text-slate-700 dark:text-slate-300">
                                        {office.ratio.toFixed(1)}
                                    </strong>
                                </span>
                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                <span>
                                    Est wait{' '}
                                    <strong className="text-slate-700 dark:text-slate-300">
                                        {formatHours(office.estWaitMinutes)}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${stringValueValue.chip}`}
                        >
                            {office.level === 'CRITICAL' && (
                                <AlertTriangle className="h-2.5 w-2.5" />
                            )}
                            {stringValueValue.label}
                        </span>
                        {criticalQueues > 0 && (
                            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                                {criticalQueues}{' '}
                                {criticalQueues === 1 ? 'queue' : 'queues'} hot
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                    <div className="col-span-4">Service</div>
                    <div className="col-span-2">Waiting</div>
                    <div className="col-span-2">Staff</div>
                    <div className="col-span-2">Ratio</div>
                    <div className="col-span-2 text-right">Est. wait</div>
                </div>

                <div>
                    {office.queues.map((itemValue) => (
                        <QueueRow key={itemValue.queueId} q={itemValue} showRatioBar />
                    ))}
                </div>
            </Card>
        </motion.div>
    )
}

export default function Workload() {
    const { push } = useToastStore()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [levelFilter, setLevelFilter] = useState('ALL')

    const load = useCallback(
        async (silent = false) => {
            if (!silent) setLoading(true)
            else setRefreshing(true)
            setError(null)
            try {
                const res = await api.get('/api/admin/workload')
                setData(res.data?.data || null)
            } catch (err) {
                const msg = err.message || 'Failed to load workload'
                setError(msg)
                if (!silent) push({ type: 'error', message: msg })
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        },
        [push]
    )

    useEffect(() => {
        load()
    }, [load])

    useAdaptivePoll(() => load(true), { fastMs: 15000, slowMs: 60000 })

    const filteredOffices = useMemo(() => {
        if (!data?.offices) return []
        let list = data.offices
        if (levelFilter !== 'ALL') {
            list = list.filter((item) => item.level === levelFilter)
        }
        if (search.trim()) {
            const searchValue = search.toLowerCase()
            list = list
                .map((item) => {
                    const nameMatch = item.officeName.toLowerCase().includes(searchValue)
                    const matchingQueues = item.queues.filter((itemValue) =>
                        itemValue.queueName.toLowerCase().includes(searchValue)
                    )
                    if (nameMatch) return item
                    if (matchingQueues.length > 0) {
                        return { ...item, queues: matchingQueues }
                    }
                    return null
                })
                .filter(Boolean)
        }
        return list
    }, [data, search, levelFilter])

    if (loading) {
        return (
            <>
                <WorkloadSkeleton />
            </>
        )
    }

    if (error || !data) {
        return (
            <>
                <EmptyState
                    icon={AlertTriangle}
                    variant="danger"
                    title="Couldn't load workload"
                    description={error || 'Something went wrong.'}
                    action={
                        <button
                            onClick={() => load()}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Try again
                        </button>
                    }
                />
            </>
        )
    }

    const stringValueValue2 = data.summary

    return (
        <>
            <div className="mb-5 flex items-center justify-end gap-3">
                <button
                    onClick={() => load(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
                <ExportButton
                    rows={(data?.offices || []).map((office) => ({
                        officeId: office.officeId,
                        officeName: office.officeName,
                        queueCount: office.queueCount,
                        waitingCount: office.waitingCount,
                        staffCount: office.staffCount,
                        ratio: office.ratio,
                        estWaitMinutes: office.estWaitMinutes,
                        level: office.level,
                    }))}
                    columns={[
                        { key: 'officeId', label: 'Office ID' },
                        { key: 'officeName', label: 'Office' },
                        { key: 'queueCount', label: 'Services' },
                        { key: 'waitingCount', label: 'Waiting' },
                        { key: 'staffCount', label: 'Staff' },
                        { key: 'ratio', label: 'Ratio (students / staff)' },
                        { key: 'estWaitMinutes', label: 'Est. Wait (min)' },
                        { key: 'level', label: 'Load Level' },
                    ]}
                    filename="uniqueue-workload"
                    label="Export"
                />
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <SummaryTile
                    label="Students waiting"
                    value={stringValueValue2.totalWaiting}
                    hint={`Across ${stringValueValue2.totalQueues} ${stringValueValue2.totalQueues === 1 ? 'service' : 'services'}`}
                    icon={Users}
                    accent="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                    valueColor="text-brand-600 dark:text-brand-400"
                />
                <SummaryTile
                    label="Staff assignments"
                    value={stringValueValue2.totalStaff}
                    hint="Staff-to-queue assignments"
                    icon={Activity}
                    accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                    valueColor="text-sky-600 dark:text-sky-400"
                />
                <SummaryTile
                    label="Worst office"
                    value={stringValueValue2.worstOfficeName || '—'}
                    hint={`${stringValueValue2.worstOfficeWaiting} waiting`}
                    icon={TrendingUp}
                    accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                    valueColor="text-amber-600 dark:text-amber-400"
                />
                <SummaryTile
                    label="Overall load"
                    value={levelStyle(stringValueValue2.overallLevel).label}
                    hint={`${data.offices.length} offices`}
                    icon={AlertTriangle}
                    accent={
                        stringValueValue2.overallLevel === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            : stringValueValue2.overallLevel === 'HIGH'
                                ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }
                    valueColor={
                        stringValueValue2.overallLevel === 'CRITICAL'
                            ? 'text-rose-600 dark:text-rose-400'
                            : stringValueValue2.overallLevel === 'HIGH'
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                    }
                />
            </div>

            {data.offices.length > 0 && (
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    <div className="relative min-w-0 flex-1 sm:max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search offices or services"
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <Filter className="mr-1 h-3.5 w-3.5 text-slate-400" />
                        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                            <button
                                key={lvl}
                                type="button"
                                onClick={() => setLevelFilter(lvl)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                                    levelFilter === lvl
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                }`}
                            >
                                {lvl === 'ALL' ? 'All' : levelStyle(lvl).label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {data.offices.length === 0 ? (
                <EmptyState
                    icon={Activity}
                    variant="info"
                    title="No workload data yet"
                    description="Once you have services and staff assigned, this dashboard will show you where the pressure is."
                />
            ) : filteredOffices.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No offices match"
                    description="Try a different search term or clear the level filter."
                    action={
                        <button
                            onClick={() => {
                                setSearch('')
                                setLevelFilter('ALL')
                            }}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                            Clear filters
                        </button>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {filteredOffices.map((filteredOffice) => (
                        <OfficeCard key={filteredOffice.officeId} office={filteredOffice} />
                    ))}
                </div>
            )}
        </>
    )
}