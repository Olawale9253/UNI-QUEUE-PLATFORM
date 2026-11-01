import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Inbox, CheckCircle2, XCircle, Building2, Mail, Phone, User as UserIcon } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { useToastStore } from '../../store/toastStore'

export default function UniversityApplications() {
    const { push } = useToastStore()
    const [apps, setApps] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionId, setActionId] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get('/api/super-admin/university-applications?status=PENDING')
            setApps(res.data.data.content || [])
        } catch (err) {
            push({ type: 'error', message: 'Failed to load applications' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    const handleApprove = async (app) => {
        if (!window.confirm(`Approve ${app.universityName}? This will create their workspace and email the admin.`)) return
        setActionId(app.id)
        try {
            await api.post(`/api/super-admin/university-applications/${app.id}/approve`)
            push({ type: 'success', message: `${app.universityName} approved! Setup email sent.` })
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to approve' })
        } finally {
            setActionId(null)
        }
    }

    const handleReject = async (app) => {
        if (!window.confirm(`Reject application for ${app.universityName}?`)) return
        setActionId(app.id)
        try {
            await api.post(`/api/super-admin/university-applications/${app.id}/reject`, { reason: 'Rejected by admin' })
            push({ type: 'success', message: 'Application rejected' })
            await load()
        } catch (err) {
            push({ type: 'error', message: 'Failed to reject' })
        } finally {
            setActionId(null)
        }
    }

    return (
        <div className="space-y-6 pb-12 px-4 sm:px-6">
            {loading ? (
                <div className="py-12 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">Loading applications...</div>
            ) : apps.length === 0 ? (
                <EmptyState
                    icon={Inbox}
                    title="No pending applications"
                    description="When a university requests access via the public site, it will appear here."
                />
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {apps.map((app) => (
                        <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="p-4 sm:p-6">
                                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                            <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{app.universityName}</h3>
                                            <Badge variant="info" className="text-[9px] sm:text-xs">{app.universityCode}</Badge>
                                        </div>
                                        <div className="mt-2 sm:mt-3 grid grid-cols-1 gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-slate-600 sm:grid-cols-2 dark:text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> {app.adminFullName} ({app.adminRole || 'Admin'})
                                            </span>
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> <span className="truncate">{app.adminEmail}</span>
                                            </span>
                                            {app.adminPhone && (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> {app.adminPhone}
                                                </span>
                                            )}
                                            {app.emailDomain && (
                                                <span className="flex items-center gap-1.5">
                                                    <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> {app.emailDomain}
                                                </span>
                                            )}
                                        </div>
                                        {app.message && (
                                            <p className="mt-2 sm:mt-3 rounded-lg bg-slate-50 p-2 sm:p-3 text-[10px] sm:text-sm italic text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                "{app.message}"
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <Button
                                            onClick={() => handleApprove(app)}
                                            disabled={actionId === app.id}
                                            className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none justify-center text-xs sm:text-sm"
                                        >
                                            <CheckCircle2 className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Approve
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleReject(app)}
                                            disabled={actionId === app.id}
                                            className="flex-1 sm:flex-none justify-center text-xs sm:text-sm"
                                        >
                                            <XCircle className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Reject
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}