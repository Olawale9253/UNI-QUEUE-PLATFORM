import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, ArrowLeft, CheckCircle2, KeyRound, AlertTriangle, Mail } from 'lucide-react'
import api from '../api/axios'
import { useToastStore } from '../store/toastStore'

export default function SetupAccount() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const { push } = useToastStore()

    const [token, setToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isExpired, setIsExpired] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const tokenValue = params.get('token')
        if (tokenValue) {
            setToken(tokenValue)
            // 🔧 SECURITY FIX: Remove token from URL immediately after reading it
            window.history.replaceState({}, document.title, '/setup-account')
        } else {
            setIsExpired(true)
        }
    }, [params])

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setLoading(true)
        try {
            await api.post('/api/auth/setup-account', { token, newPassword })
            setSuccess(true)
            push({ type: 'success', message: 'Account setup complete!' })
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            const msg = (err.message || '').toLowerCase()
            if (msg.includes('expired') || msg.includes('invalid')) {
                setIsExpired(true)
            } else {
                setError(err.message || 'Failed to set up account')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
            <div className="w-full max-w-md">
                {!success && (
                    <Link
                        to="/login"
                        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to sign in
                    </Link>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900"
                >
                    {success ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Setup Complete!
                            </h1>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                Your admin account is ready. Redirecting you to sign in…
                            </p>
                        </div>
                    ) : isExpired ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40">
                                <AlertTriangle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Link Expired
                            </h1>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                This setup link is invalid or has expired. Please contact your Super Admin to resend the invitation.
                            </p>
                            <div className="mt-6 flex flex-col gap-3">
                                <Link
                                    to="/forgot-password"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                                >
                                    <Mail className="h-4 w-4" />
                                    Request a new link
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                <ShieldCheck className="h-7 w-7" />
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                Welcome to UniQueue!
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Set a secure password to activate your administrator account.
                            </p>

                            {error && (
                                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="At least 8 characters"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-700 hover:shadow-lg disabled:opacity-60"
                                >
                                    {loading ? 'Setting up account…' : 'Complete Setup'}
                                </button>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    )
}