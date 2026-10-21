import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Mail,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    RefreshCw,
} from 'lucide-react'
import api from '../api/axios'
import { useToastStore } from '../store/toastStore'

export default function VerifyEmail() {
    const navigate = useNavigate()
    const location = useLocation()
    const { push } = useToastStore()

    const passedEmail = location.state?.email || ''

    const [email, setEmail] = useState(passedEmail)
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [resendIn, setResendIn] = useState(0)

    const codeInputRef = useRef(null)

    // Resend cooldown timer
    useEffect(() => {
        if (resendIn <= 0) return
        const token = setTimeout(() => setResendIn((s) => s - 1), 1000)
        return () => clearTimeout(token)
    }, [resendIn])

    const verify = async (event) => {
        event.preventDefault()
        setError(null)

        if (!email.trim()) {
            setError('Enter the email you registered with')
            return
        }
        if (!code.trim() || code.length < 6) {
            setError('Enter the 6-digit code')
            return
        }

        setLoading(true)
        try {
            const res = await api.post('/api/auth/verify-email', {
                email: email.trim(),
                code: code.trim(),
            })
            const data = res.data?.data

            // Save the auth token from the response
            if (data?.accessToken) {
                localStorage.setItem('uniqueue_token', data.accessToken)
                const user = {
                    userId: data.userId,
                    email: data.email,
                    fullName: data.fullName,
                    role: data.role,
                    universityId: data.universityId,
                }
                localStorage.setItem('uniqueue_user', JSON.stringify(user))
            }

            setSuccess(true)
            push({ type: 'success', message: 'Email verified! Redirecting…' })

            setTimeout(() => {
                const dashboards = {
                    SUPER_ADMIN: '/super-admin',
                    ADMIN: '/admin',
                    STAFF: '/staff',
                    USER: '/student',
                    FRESHER: '/student',
                }
                navigate(dashboards[data?.role] || '/login', { replace: true })
            }, 1200)
        } catch (err) {
            setError(err.message || 'Verification failed')
        } finally {
            setLoading(false)
        }
    }
    const resend = async () => {
        if (!email.trim()) {
            setError('Enter your email to resend the code')
            return
        }
        setResending(true)
        setError(null)
        try {
            // 🔧 FIX: Added 15-second timeout so it doesn't spin forever
            await api.post('/api/auth/resend-verification', {
                email: email.trim(),
            }, { timeout: 15000 })

            setResendIn(30)
            push({
                type: 'success',
                message: 'A fresh code has been sent to your email.',
            })
            codeInputRef.current?.focus()
        } catch (err) {
            // 🔧 FIX: Better error handling
            if (err.code === 'ECONNABORTED') {
                setError('The server took too long to respond. Please try again later.')
            } else if (err.response?.status === 500) {
                setError('The email server is currently down. Please check your backend SMTP settings.')
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to resend code')
            }
        } finally {
            setResending(false)
        }
    }

    // ── SUCCESS STATE ──
    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40"
                    >
                        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </motion.div>

                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        Email verified!
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Redirecting you to your dashboard…
                    </p>

                    <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Just a moment
                    </div>
                </motion.div>
            </div>
        )
    }

    // ── FORM STATE ──
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="mb-6 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30">
                        <ShieldCheck className="h-7 w-7 text-white" />
                    </div>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Check your email
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        We sent a 6-digit verification code to{' '}
                        {passedEmail ? (
                            <strong className="text-slate-700 dark:text-slate-300">
                                {passedEmail}
                            </strong>
                        ) : (
                            'your email address'
                        )}
                        . Enter it below to activate your account.
                    </p>
                </div>

                <form onSubmit={verify} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Email address
                        </label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                disabled={loading}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Verification code
                        </label>
                        <input
                            ref={codeInputRef}
                            type="text"
                            inputMode="numeric"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit code"
                            required
                            disabled={loading}
                            autoFocus
                            className="w-full rounded-lg border border-slate-200 bg-white py-3 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 placeholder-slate-300 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-600"
                        />
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || code.length < 6}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Verifying…
                            </>
                        ) : (
                            <>
                                Verify email
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-between pt-2 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                            Didn't receive the code?
                        </span>
                        <button
                            type="button"
                            onClick={resend}
                            disabled={resending || resendIn > 0 || loading}
                            className="inline-flex items-center gap-1.5 font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                            <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                            {resendIn > 0
                                ? `Resend in ${resendIn}s`
                                : resending
                                    ? 'Sending…'
                                    : 'Resend code'}
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Already verified?{' '}
                    <Link
                        to="/login"
                        className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}