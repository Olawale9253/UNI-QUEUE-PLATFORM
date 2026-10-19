import { useState, useEffect } from 'react'
import { Mail, Phone, University, GraduationCap, Loader2 } from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { useToastStore } from '../../store/toastStore'

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

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        )
    }

    const data = profile || user || {}

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-brand-100 text-3xl font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                        {data?.fullName?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{data?.fullName || 'Student Name'}</h2>
                        <p className="text-sm text-slate-500 mt-1">Matric No: {data?.matricNumber || 'Not provided'}</p>
                        <p className="text-sm text-slate-500">Department: {data?.department || 'Not provided'}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Account Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                            <p className="text-xs font-semibold text-slate-500">Email</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{data?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                            <p className="text-xs font-semibold text-slate-500">Phone</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{data?.phone || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <University className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                            <p className="text-xs font-semibold text-slate-500">University</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{university?.name || 'University'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <GraduationCap className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                            <p className="text-xs font-semibold text-slate-500">Level</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{data?.level || 'Not provided'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}