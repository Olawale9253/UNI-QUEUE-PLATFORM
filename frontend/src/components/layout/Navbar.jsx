import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { getInitials } from '../../lib/format'
import NotificationBell from './NotificationBell'

const roleLabels = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    STAFF: 'Staff',
    USER: 'Student',
}

const dashboards = {
    SUPER_ADMIN: '/super-admin',
    ADMIN: '/admin',
    STAFF: '/staff',
    USER: '/student',
}

export default function Navbar() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileOpen(false)
    }, [navigate])

    const handleLogout = () => {
        logout()
        setMobileOpen(false)
        navigate('/login')
    }

    return (
        <header
            className={`sticky top-0 z-40 border-b transition-all duration-300 ${
                scrolled
                    ? 'border-slate-200 bg-white/80 backdrop-blur-md shadow-sm'
                    : 'border-transparent bg-white'
            }`}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link to="/" className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ rotate: -6, scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
                    >
                        UQ
                    </motion.div>
                    <span className="text-lg font-semibold tracking-tight text-slate-900">
            UniQueue
          </span>
                </Link>

                {/* Desktop right side */}
                <div className="hidden items-center gap-1 md:flex">
                    {user && (
                        <NavLink
                            to={dashboards[user.role]}
                            className={({ isActive }) =>
                                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    isActive ? 'text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
                                }`
                            }
                        >
                            Dashboard
                        </NavLink>
                    )}

                    {user && <NotificationBell />}

                    {user ? (
                        <div className="relative" ref={menuRef}>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setOpen((v) => !v)}
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                    {getInitials(user.fullName)}
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-medium text-slate-900">
                                        {user.fullName}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {roleLabels[user.role]}
                                    </div>
                                </div>
                            </motion.button>

                            <AnimatePresence>
                                {open && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                        className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                                    >
                                        <div className="border-b border-slate-100 px-4 py-3">
                                            <div className="text-sm font-medium text-slate-900">
                                                {user.fullName}
                                            </div>
                                            <div className="truncate text-xs text-slate-500">
                                                {user.email}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                                        >
                                            <LogOut className="h-4 w-4 text-slate-500" />
                                            Sign out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                            >
                                Sign in
                            </Link>
                            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                                <Link
                                    to="/register"
                                    className="inline-block rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                                >
                                    Get started
                                </Link>
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Mobile right side */}
                <div className="flex items-center gap-1 md:hidden">
                    {user && <NotificationBell />}
                    <button
                        onClick={() => setMobileOpen((v) => !v)}
                        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
                        aria-label="Menu"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-slate-200 bg-white md:hidden"
                    >
                        <div className="space-y-1 px-4 py-3">
                            {user ? (
                                <>
                                    <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                            {getInitials(user.fullName)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium text-slate-900">
                                                {user.fullName}
                                            </div>
                                            <div className="truncate text-xs text-slate-500">
                                                {roleLabels[user.role]}
                                            </div>
                                        </div>
                                    </div>

                                    <NavLink
                                        to={dashboards[user.role]}
                                        className={({ isActive }) =>
                                            `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                isActive
                                                    ? 'bg-indigo-50 text-indigo-700'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                            }`
                                        }
                                    >
                                        Dashboard
                                    </NavLink>

                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="block rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                                    >
                                        Get started
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}