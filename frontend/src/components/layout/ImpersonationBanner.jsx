import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { useToastStore } from '../../store/toastStore'

const STORAGE_KEY = 'uniqueue_impersonation'

export function getImpersonationState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function startImpersonation(originalToken, originalUser, impersonatedUser) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ originalToken, originalUser, impersonatedUser })
    )
}

export function clearImpersonation() {
    localStorage.removeItem(STORAGE_KEY)
}

export default function ImpersonationBanner() {
    const [state, setState] = useState(getImpersonationState())
    const { setAuth } = useAuthStore()
    const { refresh: refreshUniversity } = useUniversityStore()
    const navigate = useNavigate()
    const { push } = useToastStore()

    // Poll localStorage in case another tab exits impersonation
    useEffect(() => {
        const onStorage = () => setState(getImpersonationState())
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    if (!state) return null

    const handleExit = () => {
        // Restore super admin auth
        localStorage.setItem('uniqueue_token', state.originalToken)
        localStorage.setItem('uniqueue_user', JSON.stringify(state.originalUser))
        clearImpersonation()

        setAuth(state.originalToken, state.originalUser)
        refreshUniversity()

        push({ type: 'info', message: 'Exited impersonation' })
        navigate('/super-admin')
    }

    const roleLabel = String(state.impersonatedUser?.role || '').replace('_', ' ')

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 text-amber-950 shadow-md"
            >
                <div className="flex min-w-0 items-center gap-2.5">
                    <Eye className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                            Viewing as {state.impersonatedUser?.fullName || 'user'}
                        </div>
                        <div className="truncate text-xs opacity-80">
                            {state.impersonatedUser?.email} · {roleLabel}
                            {state.impersonatedUser?.universityId
                                ? ` · University #${state.impersonatedUser.universityId}`
                                : ''}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleExit}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-950/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-amber-950/25"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Exit impersonation
                </button>
            </motion.div>
        </AnimatePresence>
    )
}