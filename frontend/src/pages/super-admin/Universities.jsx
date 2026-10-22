import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Search, ExternalLink, CheckCircle2, XCircle } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'

export default function Universities() {
    const { push } = useToastStore()
    const [universities, setUniversities] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/api/super-admin/universities')
                setUniversities(res.data?.data || [])
            } catch (err) {
                push({ type: 'error', message: 'Failed to load universities' })
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [push])

    const filtered = universities.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.code?.toLowerCase().includes(search.toLowerCase())
    )

    const total = universities.length
    const active = universities.filter(u => u.isActive).length
    const inactive = total - active

    const STATS = [
        { label: 'Total Universities', value: total, icon: Building2, color: 'text-brand-600', bg: 'bg-brand-50' },
        { label: 'Active', value: active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Inactive', value: inactive, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    ]

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Universities
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage all registered institutions on the platform.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {STATS.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {stat.label}
                                </p>
                                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color} dark:bg-slate-800/50`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content */}
            <Card padded={false}>
                <div className="border-b border-slate-100 p-4 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="w-full max-w-sm">
                        <Input
                            placeholder="Search by name or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={Search}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="No universities found"
                        description={search ? "No universities match your search." : "There are no universities on the platform yet."}
                        action={search ? <button onClick={() => setSearch('')} className="text-brand-600 text-sm font-semibold">Clear search</button> : undefined}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Institution</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Code</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Plan</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map((uni) => (
                                <tr key={uni.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                {uni.logoUrl ? (
                                                    <img src={uni.logoUrl} alt={uni.name} className="h-full w-full rounded-lg object-contain p-1" />
                                                ) : (
                                                    <Building2 className="h-5 w-5" />
                                                )}
                                            </div>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{uni.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{uni.code || '—'}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant="default">{uni.plan || 'FREE'}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={uni.isActive ? 'success' : 'danger'}>
                                            {uni.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40">
                                            Manage <ExternalLink className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    )
}