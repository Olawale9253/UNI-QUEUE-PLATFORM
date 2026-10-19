import { useState } from 'react'
import { LogOut, Loader2, AlertTriangle } from 'lucide-react'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { useNavigate } from 'react-router-dom'

/**
 * "Sign out of all devices" button. Calls /api/auth/sign-out-all,
 * which bumps tokenVersion — killing every issued JWT. After the
 * call succeeds, we clear local state and redirect to login.
 */
export default function SignOutAllButton({ variant = 'default' }) {
    const navigate = useNavigate()
    const { logout } = useAuthStore()
    const { push } = useToastStore()
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)

    const confirm = async () => {
        setBusy(true)
        try {
            await api.post('/api/auth/sign-out-all')
            push({
                type: 'success',
                message: 'Signed out on all devices. Please sign in again.',
            })
            // Clear local session — our token is dead too
            logout()
            setTimeout(() => navigate('/login'), 400)
        } catch (err) {
            push({
                type: 'error',
                message: err.message || 'Failed to sign out all devices',
            })
            setBusy(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={
                    variant === 'danger'
                        ? 'inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/40'
                        : 'inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }
            >
                <LogOut className="h-4 w-4" />
                Sign out of all devices
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={() => !busy && setOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Sign out everywhere?
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    You'll be signed out on every device and browser where you're
                                    currently logged in. You'll need to sign in again to continue.
                                </p>
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                                    Use this if you suspect your account was accessed by someone else.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                disabled={busy}
                                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirm}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                            >
                                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {busy ? 'Signing out…' : 'Sign out everywhere'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}