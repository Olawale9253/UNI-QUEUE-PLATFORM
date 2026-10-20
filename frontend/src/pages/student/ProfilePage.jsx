import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { useToastStore } from '../../store/toastStore'
import { getInitials } from '../../lib/format'

function InformationRow({ label, value }) {
    return (
        <div className="grid gap-1 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="break-words text-sm font-medium text-slate-800 dark:text-slate-200">{value || 'Not provided'}</dd>
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
        <div className="mx-auto w-full max-w-4xl space-y-4">
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Profile</h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    Your personal details and account information.
                </p>
            </div>

            {loading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    Loading your profile…
                </div>
            ) : (
                <>
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                                {getInitials(data.fullName)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    {data.fullName || 'Student Name'}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Matric No: {data.matricNumber || 'Not provided'}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Department: {data.department || 'Not provided'}
                                </p>
                            </div>
                            <Link
                                to="/student/settings"
                                className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:self-center"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit Profile
                            </Link>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account Information</h3>
                        <dl className="mt-3">
                            <InformationRow label="Email" value={data.email} />
                            <InformationRow label="Phone" value={data.phone} />
                            <InformationRow label="University" value={university?.name} />
                            <InformationRow label="Department" value={data.department} />
                            <InformationRow
                                label="Level"
                                value={data.level ? `${data.level}` : null}
                            />
                        </dl>
                    </section>
                </>
            )}
        </div>
    )
}
