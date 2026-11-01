import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Building2, Trash2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../lib/format'

export default function UniversityRequests() {
    const { push } = useToastStore()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const res = await api.get('/api/super-admin/university-requests')
            setRequests(res.data.data || [])
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load requests' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    // Group requests by university name
    const groupedRequests = useMemo(() => {
        const groups = {}
        requests.forEach(req => {
            const name = req.universityName.trim()
            if (!groups[name]) {
                groups[name] = { name, emails: [], ids: [], latest: req.createdAt }
            }
            groups[name].emails.push(req.studentEmail)
            groups[name].ids.push(req.id)
        })
        // Sort by highest demand (most emails)
        return Object.values(groups).sort((a, b) => b.emails.length - a.emails.length)
    }, [requests])

    const handleDeleteGroup = async (ids) => {
        if (!window.confirm("Mark these requests as resolved? This cannot be undone.")) return
        setProcessingId(ids[0])
        try {
            // Note: For bulk delete, you might need a specific endpoint in backend
            // For now, we delete them one by one or you can create a bulk endpoint
            await Promise.all(ids.map(id => api.delete(`/api/super-admin/university-requests/${id}`)))
            push({ type: 'success', message: 'Requests resolved!' })
            load()
        } catch (err) {
            push({ type: 'error', message: 'Failed to delete requests' })
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12 px-4 sm:px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">University Requests</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    See which universities students are requesting. Reach out to them to activate their workspace.
                </p>
            </div>

            {groupedRequests.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="No requests yet"
                    description="When students request a new university, it will show up here."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedRequests.map((group, i) => (
                        <motion.div key={group.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="p-5 flex flex-col h-full border-slate-200 dark:border-slate-800">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{group.name}</h3>
                                            <p className="text-xs text-slate-500">{formatDateTime(group.latest)}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center h-10 w-10 shrink-0 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 font-bold text-sm">
                                        {group.emails.length}
                                    </div>
                                </div>

                                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto space-y-1.5">
                                    {group.emails.map((email, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                            <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                                            <span className="truncate">{email}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 mt-auto pt-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleDeleteGroup(group.ids)}
                                        disabled={processingId === group.ids[0]}
                                        className="flex-1 text-xs"
                                    >
                                        {processingId === group.ids[0] ? 'Resolving...' : 'Resolve'}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            navigator.clipboard.writeText(group.emails.join(', '))
                                            push({ type: 'success', message: 'Emails copied to clipboard' })
                                        }}
                                        className="flex-1 text-xs"
                                    >
                                        Copy Emails
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}