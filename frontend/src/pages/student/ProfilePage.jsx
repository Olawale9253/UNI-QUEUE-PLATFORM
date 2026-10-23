import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, User, Mail, Phone, Building2, GraduationCap } from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { useToastStore } from '../../store/toastStore'
import { getInitials } from '../../lib/format'
import Card from '../../components/ui/Card'

function InformationRow({ label, value, icon: Icon }) {
    return (
        <div className="grid gap-1 border-b border-slate-100 py-3.5 last:border-b-0 dark:border-slate-800 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
            <dt className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
            </dt>
            <dd className="break-words text-sm font-medium text-slate-900 dark:text-slate-100">
                {value || 'Not provided'}
            </dd>
        </div>
    )
}

export default function ProfilePage() {
    const { user } = useAuthStore()
    const { university } = useUniversityStore()
    const { push } = useToastStore()

    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/api/profile')
            .then(res => setProfile(res.data?.data || null))
            .catch(err => push({ type: 'error', message: err.message }))
            .finally(() => setLoading(false))
    }, [push])

    const data = profile || user || {}

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-12 pt-2">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        My Profile
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Your personal details and account information.
                    </p>
                </div>
                <Link
                    to="/student/settings"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                </Link>
            </div>

            {loading ? (
                <Card className="p-8 text-center text-sm font-medium text-slate-500">
                    Loading your profile...
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Profile Hero Card */}
                    <Card>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700 shadow-sm ring-4 ring-white dark:bg-brand-950/50 dark:text-brand-300 dark:ring-slate-900">
                                {getInitials(data.fullName)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                    {data.fullName || 'Student Name'}
                                </h2>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <GraduationCap className="h-4 w-4" />
                                        {data.matricNumber || 'No matric number'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4" />
                                        {data.department || 'No department'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Account Info Card */}
                    <Card>
                        <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
                            Account Information
                        </h3>
                        <dl>
                            <InformationRow label="Email Address" value={data.email} icon={Mail} />
                            <InformationRow label="Phone Number" value={data.phone} icon={Phone} />
                            <InformationRow label="University" value={university?.name} icon={Building2} />
                            <InformationRow label="Department" value={data.department} icon={Building2} />
                            <InformationRow label="Academic Level" value={data.level ? `Level ${data.level}` : null} icon={GraduationCap} />
                        </dl>
                    </Card>
                </div>
            )}
        </div>
    )
}