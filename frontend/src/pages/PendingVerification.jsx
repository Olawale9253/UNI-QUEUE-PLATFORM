import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, LogOut, RefreshCw, ShieldCheck, XCircle } from 'lucide-react'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

export default function PendingVerification() {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const { push } = useToastStore()
    const [status, setStatus] = useState('PENDING')
    const [reason, setReason] = useState(null)
    const [checking, setChecking] = useState(false)

    const check = async () => {
        setChecking(true)
        try {
            const res = await api.get('/api/auth/me/verification-status')
            const verificationStatus = res.data?.data?.status
            setStatus(verificationStatus || 'PENDING')
            setReason(res.data?.data?.reason || null)
            if (verificationStatus === 'VERIFIED') {
                push({ type: 'success', message: 'You are verified — welcome!' })
                setTimeout(() => navigate('/student'), 800)
            }
        } catch (err) {
            // Silent fail
        } finally {
            setChecking(false)
        }
    }

    useEffect(() => { check() }, [])   // eslint-disable-line

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const rejected = status === 'REJECTED'

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                    rejected ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                }`}>
                    {rejected ? <XCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                </div>

                <h1 className="mt-5 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {rejected ? 'Registration not approved' : 'Your account is pending verification'}
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {rejected
                        ? <>Your registration was reviewed and not approved. {reason && <><br/><br/>Reason: <em>{reason}</em></>}</>
                        : <>An administrator at {user?.universityName || 'your university'} needs to verify your details. You'll get access as soon as they do — usually within a few hours.</>
                    }
                </p>

                <div className="mt-6 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={check}
                        disabled={checking}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                    >
                        <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                        {checking ? 'Checking…' : 'Check status'}
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </div>

                <p className="mt-6 text-[11px] text-slate-400">
                    Need help? <Link to="/" className="underline">Contact support</Link>
                </p>
            </div>
        </div>
    )
}