import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const IDLE_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/']

export default function IdleTimeout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, token, logout } = useAuthStore()

    const [isIdle, setIsIdle] = useState(false)
    const timeoutRef = useRef(null)

    const handleLogout = useCallback(() => {
        logout()
        setIsIdle(false)
        navigate('/login', { replace: true })
    }, [logout, navigate])

    const resetTimer = useCallback(() => {
        if (isIdle || !token || !user) return

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            setIsIdle(true)
        }, IDLE_TIMEOUT_MS)
    }, [isIdle, token, user])

    useEffect(() => {
        // Don't run the timer on public/auth pages
        const isPublicRoute = PUBLIC_ROUTES.some(route =>
            route === '/' ? location.pathname === '/' : location.pathname.startsWith(route)
        )

        if (isPublicRoute || !token || !user) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            return
        }

        // Set initial timer
        resetTimer()

        // Activity events to listen for
        const events = ['mousemove', 'keydown', 'wheel', 'mousedown', 'touchstart', 'scroll']

        // Throttle the resetTimer to prevent performance issues
        let throttleTimer = null
        const onActivity = () => {
            if (throttleTimer) return
            throttleTimer = setTimeout(() => {
                resetTimer()
                throttleTimer = null
            }, 1000) // Only reset at most once per second
        }

        events.forEach(event => document.addEventListener(event, onActivity, { passive: true }))

        return () => {
            events.forEach(event => document.removeEventListener(event, onActivity))
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            if (throttleTimer) clearTimeout(throttleTimer)
        }
    }, [location.pathname, resetTimer, token, user])

    // If the user logs out normally, ensure overlay is closed
    useEffect(() => {
        if (!token || !user) setIsIdle(false)
    }, [token, user])

    if (!isIdle) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
                >
                    <div className="flex flex-col items-center p-8 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                            <Lock className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Session Expired
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            You have been inactive for 15 minutes. For your security, we need you to sign in again to continue.
                        </p>
                        <button
                            onClick={handleLogout}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign in again
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}