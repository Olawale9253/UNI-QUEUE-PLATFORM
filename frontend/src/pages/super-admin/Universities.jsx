import { useEffect, useState } from 'react'
import { Building2, Search, ExternalLink } from 'lucide-react'
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
                // Adjust this endpoint if your API path is different
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

    return (
        <Card padded={false}>
            <div className="border-b border-slate-100 p-4 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">All Universities</h2>
                    <p className="text-xs text-slate-500">Manage active institutions on the platform.</p>
                </div>
                <div className="w-full max-w-xs">
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
                    description="There are no universities matching your search."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-500">Institution</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Code</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Plan</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                            <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filtered.map((uni) => (
                            <tr key={uni.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{uni.name}</td>
                                <td className="px-6 py-4 text-slate-500">{uni.code || '—'}</td>
                                <td className="px-6 py-4">
                                    <Badge variant="default">{uni.plan || 'FREE'}</Badge>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={uni.isActive ? 'success' : 'danger'}>
                                        {uni.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-brand-600 hover:text-brand-700 text-xs font-semibold inline-flex items-center gap-1">
                                        View <ExternalLink className="h-3 w-3" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    )
}