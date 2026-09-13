import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X, User as UserIcon, Settings as SettingsIcon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
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
    const { university, load: loadUniversity, loaded } = useUniversityStore()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        if (user && !loaded) loadUniversity()
    }, [user, loaded, loadUniversity])

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

    const handleLogout = () => {
        logout()
        setMobileOpen(false)
        navigate('/login')
    }

    const handleNavClick = () => {
        setMobileOpen(false)
        setOpen(false)
    }

    const hasUniversity = !!university?.name
    const hasLogo = !!university?.logoUrl
    const initials = university?.code || university?.name?.slice(0, 2).toUpperCase() || 'UQ'
    const isAdmin = user?.role === 'ADMIN'

    return (
        <header
            className={`sticky top-0 z-40 border-b transition-all duration-300 ${
                scrolled
                    ? 'border-slate-200 bg-white/80 backdrop-blur-md shadow-sm'
                    : 'border-transparent bg-white'
            }`}
        >
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link to="/" className="flex min-w-0 items-center gap-3" onClick={handleNavClick}>
                    {hasLogo ? (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200 sm:h-14 sm:w-14">
                            <img
                                src={university.logoUrl}
                                alt={university.name}
                                className="h-full w-full object-contain p-1"
                                onError={(e) => { e.target.style.display = 'none' }}
                            />
                        </div>
                    ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white sm:h-14 sm:w-14 sm:text-lg">
                            {hasUniversity ? initials : 'UQ'}
                        </div>
                    )}

                    <div className="min-w-0 leading-tight">
                        <div className="truncate text-sm font-bold uppercase tracking-wide text-slate-900 sm:text-base">
                            {hasUniversity ? university.name : 'UniQueue'}
                        </div>
                        <div className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:text-xs">
                            {hasUniversity ? 'Digital Queue System' : 'University Queue Management'}
                        </div>
                    </div>
                </Link>

                <div className="hidden items-center gap-1 md:flex">
                    {user && (
                        <>
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
                            <NotificationBell />

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
                                        <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
                                        <div className="text-xs text-slate-500">{roleLabels[user.role]}</div>
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
                                                <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
                                                <div className="truncate text-xs text-slate-500">{user.email}</div>
                                            </div>
                                            <Link
                                                to="/profile"
                                                onClick={handleNavClick}
                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                                            >
                                                <UserIcon className="h-4 w-4 text-slate-500" />
                                                Profile
                                            </Link>
                                            {isAdmin && (
                                                <Link
                                                    to="/admin/settings"
                                                    onClick={handleNavClick}
                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                                                >
                                                    <SettingsIcon className="h-4 w-4 text-slate-500" />
                                                    University Settings
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                                            >
                                                <LogOut className="h-4 w-4 text-slate-500" />
                                                Sign out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}

                    {!user && (
                        <div className="flex items-center gap-2">
                            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                                Sign in
                            </Link>
                            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                                <Link
                                    to="/register"
                                    className="inline-block rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                                >
                                    Get started
                                </Link>
                            </motion.div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 md:hidden">
                    {user && <NotificationBell />}
                    <button
                        onClick={() => setMobileOpen((v) => !v)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                        aria-label="Menu"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

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
                                            <div className="truncate text-sm font-medium text-slate-900">{user.fullName}</div>
                                            <div className="truncate text-xs text-slate-500">{roleLabels[user.role]}</div>
                                        </div>
                                    </div>

                                    <NavLink
                                        to={dashboards[user.role]}
                                        onClick={handleNavClick}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                                                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                                            }`
                                        }
                                    >
                                        Dashboard
                                    </NavLink>

                                    <NavLink
                                        to="/profile"
                                        onClick={handleNavClick}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                                                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                                            }`
                                        }
                                    >
                                        <UserIcon className="h-4 w-4" />
                                        Profile
                                    </NavLink>

                                    {isAdmin && (
                                        <NavLink
                                            to="/admin/settings"
                                            onClick={handleNavClick}
                                            className={({ isActive }) =>
                                                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                                                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                                                }`
                                            }
                                        >
                                            <SettingsIcon className="h-4 w-4" />
                                            University Settings
                                        </NavLink>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={handleNavClick} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                                        Sign in
                                    </Link>
                                    <Link to="/register" onClick={handleNavClick} className="block rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700">
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