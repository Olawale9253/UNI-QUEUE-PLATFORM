import { Mail, Phone, University, GraduationCap } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'

export default function ProfilePage() {
    const { user } = useAuthStore()
    const { university } = useUniversityStore()

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-brand-100 text-3xl font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                        {user?.fullName?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.fullName || 'Student Name'}</h2>
                        <p className="text-sm text-slate-500 mt-1">Matric No: {user?.matricNumber || '2025000864'}</p>
                        <p className="text-sm text-slate-500">Department: {user?.department || 'Computer Engineering'}</p>
                    </div>
                    <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        Edit Profile
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Account Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                            <p className="text-xs font-semibold text-slate-500">Email</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                            <p className="text-xs font-semibold text-slate-500">Phone</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.phone || '+234 801 234 5678'}</p>
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
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.level || '300'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}