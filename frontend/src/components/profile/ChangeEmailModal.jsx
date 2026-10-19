import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
    X as CloseIcon, Loader2, CheckCircle2, ShieldCheck, AlertCircle, Mail,
} from 'lucide-react'
import api from '../../api/axios'
import Button from '../ui/Button'
import { useToastStore } from '../../store/toastStore'

export default function ChangeEmailModal({ currentEmail, onClose, onSuccess }) {
    const { push } = useToastStore()

    const [step, setStep] = useState('request')
    const [newEmail, setNewEmail] = useState('')
    const [password, setPassword] = useState('')
    const [code, setCode] = useState('')
    const [devCode, setDevCode] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [resendIn, setResendIn] = useState(0)

    const codeInputRef = useRef(null)

    useEffect(() => {
        if (resendIn <= 0) return
        const token = setTimeout(() => setResendIn((item) => item - 1), 1000)
        return () => clearTimeout(token)
    }, [resendIn])

    useEffect(() => {
        if (step === 'verify') codeInputRef.current?.focus()
    }, [step])

    const requestCode = async (event) => {
        if (event) event.preventDefault()
        setError(null)
        if (!newEmail.trim() || !password) {
            setError('Enter your new email and current password')
            return
        }
        setLoading(true)
        try {
            const res = await api.post('/api/profile/email/request', {
                newEmail: newEmail.trim(),
                password,
            })
            const data = res.data?.data
            setDevCode(data?.devCode || null)
            setStep('verify')
            setCode('')
            setResendIn(30)
            push({ type: 'success', message: 'Verification code sent' })
        } catch (err) {
            setError(err.message || 'Failed to send code')
        } finally {
            setLoading(false)
        }
    }

    const verifyCode = async (eventValue) => {
        eventValue.preventDefault()
        setError(null)
        if (!code.trim() || code.length < 4) {
            setError('Enter the code we sent to your new email')
            return
        }
        setLoading(true)
        try {
            const res = await api.post('/api/profile/email/verify', { code: code.trim() })
            const profile = res.data?.data
            setStep('success')
            setTimeout(() => onSuccess?.(profile), 1200)
        } catch (err) {
            setError(err.message || 'Invalid or expired code')
        } finally {
            setLoading(false)
        }
    }

    const inputClass =
        'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'

    const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300'

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !loading && onClose()}
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.2 }}
                    onClick={(eventValue2) => eventValue2.stopPropagation()}
                    className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                    <button
                        onClick={() => !loading && onClose()}
                        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>

                    {step === 'request' && (
                        <form onSubmit={requestCode}>
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                                    <Mail className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        Change your email
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        We'll send a code to verify it's really yours
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Current email
                                </div>
                                <div className="mt-0.5 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {currentEmail}
                                </div>
                            </div>

                            <label className={labelClass}>New email</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(eventValue3) => setNewEmail(eventValue3.target.value)}
                                placeholder="Enter new email"
                                autoFocus
                                required
                                className={`${inputClass} mb-4`}
                            />

                            <label className={labelClass}>Confirm your password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(eventValue4) => setPassword(eventValue4.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                                className={`${inputClass} mb-4`}
                            />

                            {error && (
                                <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="mb-4 flex items-start gap-2 rounded-lg bg-sky-50 p-3 text-xs text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>
                  Your current email will be kept as a recovery email so you
                  never lose access to your account.
                </span>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={loading} disabled={loading}>
                                    Send code
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 'verify' && (
                        <form onSubmit={verifyCode}>
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                                    <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        Enter the code
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Sent to <span className="font-medium text-slate-700 dark:text-slate-300">{newEmail}</span>
                                    </p>
                                </div>
                            </div>

                            {devCode && (
                                <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <div>
                                        <span className="font-semibold">Dev mode:</span> code is{' '}
                                        <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-bold dark:bg-amber-900/60">
                                            {devCode}
                                        </code>
                                    </div>
                                </div>
                            )}

                            <label className={labelClass}>Verification code</label>
                            <input
                                ref={codeInputRef}
                                type="text"
                                inputMode="numeric"
                                value={code}
                                onChange={(eventValue5) => setCode(eventValue5.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Enter verification code"
                                required
                                className="mb-2 w-full rounded-lg border border-slate-200 bg-white py-3 text-center font-mono text-2xl tracking-[0.4em] text-slate-900 placeholder-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-600"
                            />

                            <div className="mb-4 flex items-center justify-between text-xs">
                                <button
                                    type="button"
                                    onClick={requestCode}
                                    disabled={resendIn > 0 || loading}
                                    className="font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-400"
                                >
                                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStep('request'); setError(null); setCode('') }}
                                    className="text-slate-500 hover:text-slate-700"
                                >
                                    Change email
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={loading} disabled={loading || code.length < 4}>
                                    Verify & change
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="py-4 text-center">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40"
                            >
                                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </motion.div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Email updated!
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                You'll use <strong className="text-slate-700 dark:text-slate-300">{newEmail}</strong>{' '}
                                next time you sign in.
                            </p>
                            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Closing…
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </>
    )
}