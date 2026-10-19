import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X as CloseIcon, Mail, Lock, Loader2, ArrowLeft, CheckCircle2, AlertTriangle,
    Copy, Check, ShieldCheck, RefreshCw,
} from 'lucide-react'
import api from '../../api/axios'
import Button from '../ui/Button'
import { useToastStore } from '../../store/toastStore'

/* ------------------------------------------------------------------ */
/*  Copy-to-clipboard micro-component                                  */
/* ------------------------------------------------------------------ */

function CopyCode({ code }) {
    const [copied, setCopied] = useState(false)
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {}
    }
    return (
        <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-100 dark:bg-slate-900 dark:text-brand-300 dark:hover:bg-slate-800"
        >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy code'}
        </button>
    )
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Request                                                   */
/* ------------------------------------------------------------------ */

function RequestStep({ onSuccess, onCancel }) {
    const { push } = useToastStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    const canSubmit = validEmail && password.trim().length > 0

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!canSubmit) return
        setSubmitting(true)
        try {
            const res = await api.post('/api/profile/email/request', {
                newEmail: email.trim().toLowerCase(),
                password,
            })
            push({ type: 'success', message: 'Verification code sent' })
            onSuccess?.({
                email: res.data?.data?.email || email.trim().toLowerCase(),
                expiresInMinutes: res.data?.data?.expiresInMinutes ?? 15,
                devCode: res.data?.data?.devCode || null,
            })
        } catch (err) {
            push({
                type: 'error',
                message: err.message || 'Could not send the verification code',
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    <Mail className="h-3 w-3" />
                    New email address
                </label>
                <input
                    type="email"
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(eventValue) => setEmail(eventValue.target.value)}
                    placeholder="you@university.edu.ng"
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-900"
                />
            </div>

            <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    <Lock className="h-3 w-3" />
                    Current password
                </label>
                <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(eventValue2) => setPassword(eventValue2.target.value)}
                    placeholder="Confirm with your password"
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-900"
                />
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    For your security, confirm the change with your password.
                </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    Cancel
                </button>
                <Button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    loading={submitting}
                    icon={Mail}
                >
                    Send code
                </Button>
            </div>
        </form>
    )
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Verify                                                    */
/* ------------------------------------------------------------------ */

function VerifyStep({ request, onSuccess, onBack, onResent }) {
    const { push } = useToastStore()
    const [code, setCode] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [resending, setResending] = useState(false)
    const [secondsLeft, setSecondsLeft] = useState((request.expiresInMinutes || 15) * 60)
    const [devCode, setDevCode] = useState(request.devCode || null)
    const inputRef = useRef(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        if (secondsLeft <= 0) return undefined
        const token = setInterval(() => setSecondsLeft((item) => Math.max(0, item - 1)), 1000)
        return () => clearInterval(token)
    }, [secondsLeft])

    const expired = secondsLeft <= 0
    const canSubmit = code.trim().length >= 4 && !submitting && !expired

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!canSubmit) return
        setSubmitting(true)
        try {
            const res = await api.post('/api/profile/email/verify', {
                code: code.trim(),
            })
            push({ type: 'success', message: 'Email updated' })
            onSuccess?.(res.data?.data)
        } catch (err) {
            push({
                type: 'error',
                message: err.message || 'Invalid or expired code',
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleResend = async () => {
        if (resending) return
        setResending(true)
        try {
            const res = await api.post('/api/profile/email/resend')
            const data = res.data?.data || {}
            setCode('')
            setDevCode(data.devCode || null)
            setSecondsLeft((data.expiresInMinutes || 15) * 60)
            push({ type: 'success', message: 'New code sent' })
            onResent?.(data)
        } catch (err) {
            push({
                type: 'error',
                message: err.message || 'Could not resend the code',
            })
        } finally {
            setResending(false)
        }
    }

    const mm = Math.floor(secondsLeft / 60)
    const ss = String(secondsLeft % 60).padStart(2, '0')

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900 dark:bg-brand-950/30">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                            Code sent to
                        </div>
                        <div className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {request.email}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            {expired
                                ? 'Code has expired. Request a new one below.'
                                : `Expires in ${mm}:${ss}`}
                        </div>
                    </div>
                </div>

                {devCode && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                Dev mode
                            </div>
                            <div className="font-mono text-sm font-bold text-amber-900 dark:text-amber-200">
                                {devCode}
                            </div>
                        </div>
                        <CopyCode code={devCode} />
                    </div>
                )}
            </div>

            <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="h-3 w-3" />
                    Verification code
                </label>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(eventValue) => setCode(eventValue.target.value.replace(/\s+/g, ''))}
                    placeholder="Enter the code"
                    disabled={submitting || expired}
                    maxLength={10}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.3em] text-slate-900 shadow-sm outline-none transition-all placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-900"
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={submitting || resending}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Change email
                    </button>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={submitting || resending}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                    >
                        {resending ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Sending…
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-3 w-3" />
                                Resend code
                            </>
                        )}
                    </button>
                </div>
                <Button
                    type="submit"
                    disabled={!canSubmit || expired}
                    loading={submitting}
                    icon={CheckCircle2}
                >
                    Verify &amp; update
                </Button>
            </div>
        </form>
    )
}

/* ------------------------------------------------------------------ */
/*  Main modal                                                         */
/* ------------------------------------------------------------------ */

export default function ChangeEmailModal({ open, onClose, currentEmail, onUpdated }) {
    const [step, setStep] = useState('request')
    const [request, setRequest] = useState(null)

    useEffect(() => {
        if (open) {
            setStep('request')
            setRequest(null)
        }
    }, [open])

    useEffect(() => {
        if (!open) return undefined
        const onKey = (event) => {
            if (event.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => {
            document.body.style.overflow = ''
        }
    }, [open])

    const handleRequestSuccess = (payload) => {
        setRequest(payload)
        setStep('verify')
    }

    const handleVerifySuccess = (updatedProfile) => {
        onUpdated?.(updatedProfile)
        onClose?.()
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm"
                    />
                    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(event) => event.stopPropagation()}
                            className="relative my-8 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                        >
                            <button
                                onClick={onClose}
                                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                aria-label="Close"
                            >
                                <CloseIcon className="h-4 w-4" />
                            </button>

                            <div className="px-6 py-5">
                                <div className="mb-5 pr-6">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                            {step === 'request' ? 'Change email' : 'Verify new email'}
                                        </h2>
                                    </div>
                                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        {step === 'request'
                                            ? 'We’ll send a verification code to the new address.'
                                            : 'Enter the code we just sent to finish the change.'}
                                    </p>
                                    {currentEmail && step === 'request' && (
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Current:{' '}
                                            <span className="font-medium text-slate-600 dark:text-slate-400">
                                                {currentEmail}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {step === 'request' ? (
                                    <RequestStep
                                        onSuccess={handleRequestSuccess}
                                        onCancel={onClose}
                                    />
                                ) : (
                                    <VerifyStep
                                        request={request}
                                        onSuccess={handleVerifySuccess}
                                        onBack={() => setStep('request')}
                                        onResent={(data) => {
                                            setRequest((prev) => ({
                                                ...prev,
                                                email: data.email || prev?.email,
                                                expiresInMinutes:
                                                    data.expiresInMinutes ??
                                                    prev?.expiresInMinutes ??
                                                    15,
                                                devCode: data.devCode || null,
                                            }))
                                        }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}