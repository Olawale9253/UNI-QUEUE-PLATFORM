import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react'
import api from '../api/axios'
import { useToastStore } from '../store/toastStore'

export default function ResetPassword() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const { push } = useToastStore()

    const [token, setToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const tokenValue = params.get('token')
        if (tokenValue) setToken(tokenValue)
    }, [params])

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        if (!token) {
            setError('Reset token is required')
            return
        }
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
            await api.post('/api/auth/reset-password', { token, newPassword })
            setSuccess(true)
            push({ type: 'success', message: 'Password reset. You can now sign in.' })
            setTimeout(() => navigate('/login'), 1500)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="mx-auto max-w-md px-4">
                <Link
                    to="/login"
                    className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                </Link>

                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    {success ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h1 className="text-xl font-semibold text-slate-900">
                                Password updated
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Redirecting you to sign in…
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                                <KeyRound className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Set a new password
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                At least 8 characters.
                            </p>

                            {error && (
                                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                {/* Token field — always visible for debugging */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Reset token {token && <span className="text-emerald-600">✓ loaded from URL</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={token}
                                        onChange={(eventValue) => setToken(eventValue.target.value)}
                                        placeholder="Paste your reset token"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Get this from the Forgot Password page.
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        New password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(eventValue2) => setNewPassword(eventValue2.target.value)}
                                        placeholder="At least 8 characters"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Confirm new password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(eventValue3) => setConfirmPassword(eventValue3.target.value)}
                                        placeholder="Re-enter password"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? 'Resetting…' : 'Reset password'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}