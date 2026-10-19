import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Send, CheckCircle2, Copy } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import api from '../api/axios'
import { useToastStore } from '../store/toastStore'
import { ease, fadeUp } from '../lib/motion'

export default function ForgotPassword() {
    const navigate = useNavigate()
    const { push } = useToastStore()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [resetToken, setResetToken] = useState(null)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        try {
            const res = await api.post('/api/auth/forgot-password', { email })
            setSent(true)
            const token = res.data.data?.resetToken
            if (token) setResetToken(token)
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to send reset link' })
        } finally {
            setLoading(false)
        }
    }

    const copyToken = () => {
        navigator.clipboard.writeText(resetToken)
        push({ type: 'success', message: 'Token copied' })
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
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                </Link>

                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    {!sent ? (
                        <>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                Forgot password?
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Enter the email you registered with and we'll send a reset link.
                            </p>

                            <form onSubmit={handleSubmit} className="mt-6">
                                <Input
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(eventValue) => setEmail(eventValue.target.value)}
                                    placeholder="you@university.edu.ng"
                                    icon={Mail}
                                    required
                                    autoFocus
                                />

                                <Button type="submit" fullWidth loading={loading} disabled={loading}>
                                    {loading ? 'Sending…' : 'Send reset link'}
                                    {!loading && <Send className="h-4 w-4" />}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                                Check your email
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                If an account exists with <strong>{email}</strong>, a reset link has been
                                sent. It expires in 30 minutes.
                            </p>

                            {resetToken && (
                                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
                                    <p className="mb-2 font-medium text-amber-900">
                                        ⚠️ Dev mode — reset link (email not configured):
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 truncate rounded bg-white px-2 py-1 font-mono text-[10px] text-amber-900">
                                            {resetToken}
                                        </code>
                                        <button
                                            onClick={copyToken}
                                            className="rounded-md border border-amber-300 bg-white p-1.5 transition-colors hover:bg-amber-100"
                                            aria-label="Copy token"
                                        >
                                            <Copy className="h-3.5 w-3.5 text-amber-700" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                                        className="mt-2 text-[11px] font-medium text-amber-800 underline"
                                    >
                                        Open reset page →
                                    </button>
                                </div>
                            )}

                            <Button
                                variant="secondary"
                                fullWidth
                                className="mt-5"
                                onClick={() => {
                                    setSent(false)
                                    setEmail('')
                                    setResetToken(null)
                                }}
                            >
                                Try a different email
                            </Button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    )
}