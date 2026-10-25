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
    Building2,
    X,
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
    const [isPublicMenuOpen, setIsPublicMenuOpen] = useState(false)
    const [logoFailed, setLogoFailed] = useState(false)
    const menuRef = useRef(null)

    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    const hasUniversity = !isSuperAdmin && !!university?.name
    const hasLogo = !isSuperAdmin && !!university?.logoUrl && !logoFailed
    const initials = university?.code || university?.name?.slice(0, 2).toUpperCase() || 'UQ'

    const isDashboardRoute = DASHBOARD_PREFIXES.some((item) =>
        location.pathname.startsWith(item)
    )
    const showHamburger = !!user && isDashboardRoute

    useEffect(() => {
        if (user && user.role !== 'SUPER_ADMIN' && !loaded && load) load()
    }, [user, loaded, load])

    useEffect(() => {
        setLogoFailed(false)
    }, [university?.logoUrl])

    useEffect(() => {
        const handler = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        setMenuOpen(false)
        setIsPublicMenuOpen(false)
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

    // 👇 NEW: role-aware profile link
    const profileHrefs = {
        SUPER_ADMIN: '/super-admin/profile',
        ADMIN: '/admin/profile',
        STAFF: '/staff/profile',
        USER: '/student/profile',
        FRESHER: '/student/profile',
    }
    const profileHref = user ? profileHrefs[user.role] || '/' : '/'

    const navLinkClass = ({ isActive }) =>
        `relative flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ${
            isActive
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400'
        }`

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
            <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

                {/* LEFT: LOGO & BRANDING */}
                <div className="flex min-w-0 items-center gap-3">
                    {showHamburger && (
                        <>
                            <button
                                onClick={toggleSidebar}
                                aria-label="Toggle menu"
                                title="Toggle menu"
                                className="group hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 md:inline-flex dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            >
                                <Menu className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
                            </button>
                            <button
                                onClick={openMobileSidebar}
                                aria-label="Open menu"
                                className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 md:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            >
                                <Menu className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
                            </button>
                        </>
                    )}

                    <Link
                        to={dashboardHref}
                        className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 sm:h-11 sm:w-11 dark:bg-slate-900 dark:ring-white/10">
                            {isSuperAdmin ? (
                                <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white dark:bg-slate-800">
                                    <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                            ) : hasLogo ? (
                                <img
                                    src={university.logoUrl}
                                    alt={university.name}
                                    className="h-full w-full rounded-xl object-contain p-1"
                                    onError={() => setLogoFailed(true)}
                                />
                            ) : hasUniversity ? (
                                <div className="flex h-full w-full items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                                    {initials}
                                </div>
                            ) : (
                                <Logo size={32} variant="icon" />
                            )}
                        </div>

                        <div className="hidden min-w-0 sm:block">
                            <div className="truncate text-sm font-extrabold uppercase tracking-tight text-slate-900 sm:text-base dark:text-slate-100">
                                {isSuperAdmin ? 'UniQueue' : hasUniversity ? university.name : 'UniQueue'}
                            </div>
                            <div className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                {isSuperAdmin ? 'Platform Console' : 'Digital Queue System'}
                            </div>
                        </div>
                    </Link>
                </div>

                {/* CENTER: DESKTOP NAV LINKS */}
                {!user && (
                    <nav className="hidden items-center gap-6 lg:flex">
                        <NavLink to="/" className={navLinkClass}>
                            {({ isActive }) => (
                                <>
                                    Home
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-brand-600"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/for-universities" className={navLinkClass}>
                            {({ isActive }) => (
                                <>
                                    For Universities
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-brand-600"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    </nav>
                )}

                {/* RIGHT: ACTIONS & AUTH */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                            <ThemeToggle />
                        </div>
                        {user && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                                <NotificationBell />
                            </div>
                        )}
                    </div>

                    {!user && <div className="hidden h-6 w-px bg-slate-200 lg:block dark:bg-slate-800" />}

                    {user ? (
                        <div ref={menuRef} className="relative ml-1">
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                className="flex items-center gap-2 rounded-full border border-slate-200/60 bg-white p-1 pr-3 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
                                aria-label="User menu"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow-inner">
                                    {getInitials(user.fullName)}
                                </div>
                                <div className="hidden text-left xl:block pr-1">
                                    <div className="max-w-[120px] truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {user.fullName}
                                    </div>
                                </div>
                                <ChevronDown
                                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                                        menuOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
                                    >
                                        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                            <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                                                {user.fullName}
                                            </div>
                                            <div className="truncate text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                                {user.email}
                                            </div>
                                        </div>

                                        <div className="p-2">
                                            <Link
                                                to={profileHref}
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                            >
                                                <UserIcon className="h-4 w-4 text-slate-400" />
                                                My Profile
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link
                                to="/login"
                                className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 sm:inline-flex dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                            >
                                Get started
                            </Link>

                            <button
                                onClick={() => setIsPublicMenuOpen(!isPublicMenuOpen)}
                                className="ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                {isPublicMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MOBILE PUBLIC MENU DROPDOWN */}
            <AnimatePresence>
                {!user && isPublicMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-950"
                    >
                        <div className="flex flex-col px-4 py-3 gap-1">
                            <NavLink
                                to="/"
                                onClick={() => setIsPublicMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                                        isActive
                                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`
                                }
                            >
                                <Home className="h-4 w-4" />
                                Home
                            </NavLink>
                            <NavLink
                                to="/for-universities"
                                onClick={() => setIsPublicMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                                        isActive
                                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`
                                }
                            >
                                <Building2 className="h-4 w-4" />
                                For Universities
                            </NavLink>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}