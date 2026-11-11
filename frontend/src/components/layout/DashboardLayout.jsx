import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X as CloseIcon, Home as HomeIcon, LogOut } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'

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
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={`h-5 w-5 shrink-0 ${
                            isActive
                                ? 'text-brand-600 dark:text-brand-400'
                                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
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
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => { closeMobileSidebar() }, [location.pathname, closeMobileSidebar])
    useEffect(() => {
        document.body.style.overflow = mobileSidebarOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [mobileSidebarOpen])

    const homeHref = user ? ROLE_HOME[user.role] || '/' : '/'
    const homeItem = { to: homeHref, label: 'Home', icon: HomeIcon, end: true }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-white dark:bg-slate-900">
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                <div className="space-y-1">
                    <SidebarLink item={homeItem} onClick={closeMobileSidebar} />
                    <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
                    {tabs.map((item) => (
                        <SidebarLink key={item.to} item={item} onClick={closeMobileSidebar} />
                    ))}
                </div>
            </nav>

            <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                >
                    <LogOut className="h-5 w-5" />
                    Log Out
                </button>
            </div>
        </div>
    )

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white dark:bg-slate-950">
            <aside className="hidden h-full w-64 shrink-0 border-r border-slate-200 md:block dark:border-slate-800">
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

            {/* Main scroll container. Removed vertical padding so sticky works perfectly */}
            <main className="min-w-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[1400px] px-4 pb-8 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    )
}