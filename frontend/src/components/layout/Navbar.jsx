import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield,
    LogOut,
    User as UserIcon,
    ChevronDown,
    Menu,
    Home,
    Info,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { useUIStore } from '../../store/uiStore'
import { getInitials } from '../../lib/format'
import NotificationBell from './NotificationBell'
import ThemeToggle from '../ui/ThemeToggle'
import Logo from '../ui/Logo'

const DASHBOARD_PREFIXES = ['/student', '/staff', '/admin', '/super-admin']

export default function Navbar() {
    const { user, logout } = useAuthStore()
    const { university, load, loaded } = useUniversityStore()
    const { toggleSidebar, openMobileSidebar } = useUIStore()
    const navigate = useNavigate()
    const location = useLocation()

    const [menuOpen, setMenuOpen] = useState(false)
    const [logoFailed, setLogoFailed] = useState(false)
    const menuRef = useRef(null)

    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    const hasUniversity = !isSuperAdmin && !!university?.name
    const hasLogo = !isSuperAdmin && !!university?.logoUrl && !logoFailed
    const initials = university?.code || university?.name?.slice(0, 2).toUpperCase() || 'UQ'

    const isDashboardRoute = DASHBOARD_PREFIXES.some((p) =>
        location.pathname.startsWith(p)
    )
    const showHamburger = !!user && isDashboardRoute

    // Load university info once
    useEffect(() => {
        if (user && user.role !== 'SUPER_ADMIN' && !loaded && load) load()
    }, [user, loaded, load])

    // Reset logo error on URL change
    useEffect(() => {
        setLogoFailed(false)
    }, [university?.logoUrl])

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Close dropdown on route change
    useEffect(() => {
        setMenuOpen(false)
    }, [location.pathname])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const dashboards = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        STAFF: '/staff',
        USER: '/student',
        FRESHER: '/student',
    }
    const dashboardHref = user ? dashboards[user.role] || '/' : '/'

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex h-16 w-full items-center justify-between gap-2 px-3 sm:px-5 lg:px-6">
                {/* ───── LEFT: hamburger + brand ───── */}
                <div className="flex min-w-0 items-center gap-2">
                    {/* Hamburger — same three-line icon on every device */}
                    {showHamburger && (
                        <>
                            {/* Desktop: toggles the sidebar rail */}
                            <button
                                onClick={toggleSidebar}
                                aria-label="Toggle menu"
                                title="Toggle menu"
                                className="group hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:inline-flex dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            >
                                <Menu className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                            </button>

                            {/* Mobile: opens the drawer */}
                            <button
                                onClick={openMobileSidebar}
                                aria-label="Open menu"
                                className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            >
                                <Menu className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                            </button>
                        </>
                    )}

                    {/* Brand */}
                    <Link
                        to={dashboardHref}
                        className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200 sm:h-12 sm:w-12 dark:bg-slate-800 dark:ring-slate-700">
                            {isSuperAdmin ? (
                                <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white dark:bg-slate-700">
                                    <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                            ) : hasLogo ? (
                                <img
                                    src={university.logoUrl}
                                    alt={university.name}
                                    className="h-full w-full object-contain p-1"
                                    onError={() => setLogoFailed(true)}
                                />
                            ) : hasUniversity ? (
                                <div className="flex h-full w-full items-center justify-center bg-brand-600 text-sm font-bold text-white sm:text-base">
                                    {initials}
                                </div>
                            ) : (
                                <Logo size={40} variant="icon" />
                            )}
                        </div>

                        <div className="hidden min-w-0 sm:block">
                            <div className="truncate text-base font-bold uppercase tracking-tight text-slate-900 sm:text-lg dark:text-slate-100">
                                {isSuperAdmin
                                    ? 'UniQueue'
                                    : hasUniversity
                                        ? university.name
                                        : 'UniQueue'}
                            </div>
                            <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {isSuperAdmin
                                    ? 'Platform Console'
                                    : hasUniversity
                                        ? 'Digital Queue System'
                                        : 'University Queue'}
                            </div>
                        </div>
                    </Link>
                </div>

                {/* ───── RIGHT: utilities + user ───── */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {!user && (
                        <nav className="hidden items-center gap-1 lg:flex">
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`
                                }
                            >
                                Home
                            </NavLink>
                        </nav>
                    )}

                    <ThemeToggle />
                    {user && <NotificationBell />}

                    {user ? (
                        <div ref={menuRef} className="relative">
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 sm:px-2"
                                aria-label="User menu"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-700">
                                    {getInitials(user.fullName)}
                                </div>
                                <div className="hidden text-left xl:block">
                                    <div className="max-w-[140px] truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {user.fullName}
                                    </div>
                                    <div className="max-w-[140px] truncate text-[10px] text-slate-500 dark:text-slate-400">
                                        {user.email}
                                    </div>
                                </div>
                                <ChevronDown
                                    className={`hidden h-4 w-4 shrink-0 text-slate-400 transition-transform sm:block ${
                                        menuOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {user.fullName}
                                            </div>
                                            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                {user.email}
                                            </div>
                                        </div>

                                        <div className="p-1">
                                            <Link
                                                to="/profile"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                            >
                                                <UserIcon className="h-4 w-4 text-slate-400" />
                                                My profile
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Sign out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Link
                                to="/login"
                                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:inline-flex dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 sm:px-4"
                            >
                                Get started
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile-only entry links when logged out */}
            {!user && (
                <div className="flex items-center gap-1 border-t border-slate-100 px-3 py-2 sm:hidden dark:border-slate-800">
                    <Link
                        to="/"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-400"
                    >
                        <Home className="h-4 w-4 text-slate-400" />
                        Home
                    </Link>
                    <Link
                        to="/login"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-400"
                    >
                        <Info className="h-4 w-4 text-slate-400" />
                        Sign in
                    </Link>
                </div>
            )}
        </header>
    )
}