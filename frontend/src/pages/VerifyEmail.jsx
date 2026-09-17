import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Mail,
    ShieldCheck,
    CheckCircle2,
    Copy,
    ArrowRight,
    RefreshCw,
} from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease, fadeUp } from '../lib/motion'

export default function VerifyEmail() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()
    const { push } = useToastStore()

    const [email, setEmail] = useState(params.get('email') || '')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [success, setSuccess] = useState(false)
    const [devCode, setDevCode] = useState(params.get('code') || null)

    useEffect(() => {
        const e = params.get('email')
        const c = params.get('code')
        if (e) setEmail(e)
        if (c) setDevCode(c)
    }, [params])

    const copyCode = () => {
        navigator.clipboard.writeText(devCode)
        push({ type: 'success', message: 'Code copied' })
    }

    const useCode = () => {
        if (devCode) setCode(devCode)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await api.post('/api/auth/verify-email', {
                email: email.trim().toLowerCase(),
                code: code.trim(),
            })
            const d = res.data.data

            localStorage.setItem('uniqueue_token', d.accessToken)
            localStorage.setItem(
                'uniqueue_user',
                JSON.stringify({
                    userId: d.userId,
                    email: d.email,
                    fullName: d.fullName,
                    role: d.role,
                    universityId: d.universityId,
                })
            )
            setAuth(d.accessToken, {
                userId: d.userId,
                email: d.email,
                fullName: d.fullName,
                role: d.role,
                universityId: d.universityId,
            })

            setSuccess(true)
            push({ type: 'success', message: 'Email verified. Welcome!' })
            setTimeout(() => navigate('/student'), 1200)
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Verification failed',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (!email.trim()) {
            push({ type: 'error', message: 'Enter your email first' })
            return
        }
        setResending(true)
        try {
            const res = await api.post('/api/auth/resend-verification', {
                email: email.trim().toLowerCase(),
            })
            const newCode = res.data.data?.devVerificationCode
            if (newCode) setDevCode(newCode)
            push({ type: 'success', message: 'A new code was sent to your email' })
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to resend',
            })
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <motion.div
                variants={fadeUp}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.5, ease }}
                className="w-full max-w-md"
            >
                <Link
                    to="/login"
                    className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
                >
                    ← Back to sign in
                </Link>

                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    {success ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h1 className="text-xl font-semibold text-slate-900">
                                Email verified!
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Redirecting to your dashboard…
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                                <ShieldCheck className="h-6 w-6 text-brand-600" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                Verify your email
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Enter the 6-digit code we sent to your email address. This confirms
                                you own the account and prevents impersonation.
                            </p>

                            {devCode && (
                                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
                                    <p className="mb-2 font-medium text-amber-900">
                                        ⚠️ Dev mode — verification code (email not configured):
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 rounded bg-white px-3 py-2 text-center font-mono text-lg font-semibold tracking-widest text-amber-900">
                                            {devCode}
                                        </code>
                                        <button
                                            onClick={copyCode}
                                            className="rounded-md border border-amber-300 bg-white p-2 transition-colors hover:bg-amber-100"
                                            aria-label="Copy"
                                        >
                                            <Copy className="h-3.5 w-3.5 text-amber-700" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={useCode}
                                        className="mt-2 text-[11px] font-medium text-amber-800 underline"
                                    >
                                        Auto-fill this code
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-5">
                                <Input
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@university.edu.ng"
                                    icon={Mail}
                                    required
                                />

                                <div className="mb-4">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Verification code <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-center font-mono text-2xl font-semibold tracking-[0.5em] text-slate-900 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    fullWidth
                                    loading={loading}
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying…' : 'Verify email'}
                                    {!loading && <ArrowRight className="h-4 w-4" />}
                                </Button>
                            </form>

                            <div className="mt-5 flex items-center justify-between text-sm">
                                <span className="text-slate-500">Didn't get the code?</span>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="inline-flex items-center gap-1.5 font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-50"
                                >
                                    <RefreshCw
                                        className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`}
                                    />
                                    {resending ? 'Sending…' : 'Resend code'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
