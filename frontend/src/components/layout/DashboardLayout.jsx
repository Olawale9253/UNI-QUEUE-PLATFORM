import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X as CloseIcon, Home as HomeIcon, LogOut, Building2 } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'

const ROLE_HOME = {
    SUPER_ADMIN: '/super-admin',
    ADMIN: '/admin',
    STAFF: '/staff',
    USER: '/student',
    FRESHER: '/student',
}

function SidebarLink({ item, onClick }) {
    const Icon = item.icon
    return (
        <NavLink
            to={item.to}
            end={item.end}
            onClick={onClick}
            className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={`h-5 w-5 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        }`}
                    />
                    <span className="truncate">{item.label}</span>
                </>
            )}
        </NavLink>
    )
}

export default function DashboardLayout({ tabs, children }) {
    const { mobileSidebarOpen, closeMobileSidebar } = useUIStore()
    const { user, logout } = useAuthStore()
    const { university } = useUniversityStore()
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => { closeMobileSidebar() }, [location.pathname, closeMobileSidebar])
    useEffect(() => {
        document.body.style.overflow = mobileSidebarOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [mobileSidebarOpen])

    const homeHref = user ? ROLE_HOME[user.role] || '/' : '/'
    const homeItem = { to: homeHref, label: 'Dashboard', icon: HomeIcon, end: true }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-[#0f172a] text-white">
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <h1 className="truncate text-sm font-bold leading-tight">{university?.name || 'UniQueue'}</h1>
                    <p className="text-[10px] text-slate-400">Digital Queue System</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                <div className="space-y-1">
                    <SidebarLink item={homeItem} onClick={closeMobileSidebar} />
                    <div className="my-2 border-t border-slate-800" />
                    {tabs.map((item) => (
                        <SidebarLink key={item.to} item={item} onClick={closeMobileSidebar} />
                    ))}
                </div>
            </nav>

            <div className="border-t border-slate-800 p-3">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                >
                    <LogOut className="h-5 w-5" />
                    Log Out
                </button>
            </div>
        </div>
    )

    return (
        <div className="flex min-h-[calc(100vh-4rem)] w-full bg-[#f8fafc] dark:bg-slate-950">
            <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 self-start md:block">
                <SidebarContent />
            </aside>

            <AnimatePresence>
                {mobileSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeMobileSidebar}
                            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:hidden"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <main className="min-w-0 flex-1">
                <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    )
}