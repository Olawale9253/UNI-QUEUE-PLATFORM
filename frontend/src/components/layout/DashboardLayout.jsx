import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X as CloseIcon, Home as HomeIcon, LogOut } from 'lucide-react'
import PageHeader from './PageHeader'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'

const ROLE_HOME = {
    SUPER_ADMIN: '/super-admin',
    ADMIN: '/admin',
    STAFF: '/staff',
    USER: '/student',
    FRESHER: '/student',
}

function SidebarLink({ item, collapsed, onClick }) {
    const Icon = item.icon
    return (
        <NavLink
            to={item.to}
            end={item.end}
            onClick={onClick}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
                `group flex items-center rounded-lg py-2 text-sm font-medium transition-colors ${
                    collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                } ${
                    isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={`h-4 w-4 shrink-0 ${
                            isActive
                                ? 'text-brand-600 dark:text-brand-400'
                                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                </>
            )}
        </NavLink>
    )
}

export default function DashboardLayout({ tabs, title, description, action, children }) {
    const { sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useUIStore()
    const { user, logout } = useAuthStore()
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        closeMobileSidebar()
    }, [location.pathname, closeMobileSidebar])

    useEffect(() => {
        document.body.style.overflow = mobileSidebarOpen ? 'hidden' : ''
        return () => {
            document.body.style.overflow = ''
        }
    }, [mobileSidebarOpen])

    const handleExit = () => {
        logout()
        navigate('/')
    }

    const homeHref = user ? ROLE_HOME[user.role] || '/' : '/'
    const homeItem = { to: homeHref, label: 'Home', icon: HomeIcon, end: true }

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white dark:bg-slate-950">
            <aside
                className={`hidden h-full shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-sm transition-[width] duration-300 ease-out md:flex dark:border-slate-800 dark:bg-slate-900/90 ${
                    sidebarCollapsed ? 'w-16' : 'w-56'
                }`}
            >
                <nav className="flex-1 overflow-y-auto px-2 py-4">
                    {!sidebarCollapsed && (
                        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Menu
                        </p>
                    )}
                    <div className="space-y-0.5">
                        <SidebarLink item={homeItem} collapsed={sidebarCollapsed} />
                    </div>
                    <div className="my-2 mx-2 border-t border-slate-100 dark:border-slate-800" />
                    <div className="space-y-0.5">
                        {tabs.map((item) => (
                            <SidebarLink key={item.to} item={item} collapsed={sidebarCollapsed} />
                        ))}
                    </div>
                </nav>

                <div className="shrink-0 border-t border-slate-200 p-2 dark:border-slate-800">
                    <button
                        onClick={handleExit}
                        title={sidebarCollapsed ? "Log Out" : undefined}
                        className={`group flex w-full items-center rounded-lg py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 ${
                            sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                        }`}
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">Log Out</span>}
                    </button>
                </div>
            </aside>

            <AnimatePresence>
                {mobileSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }} onClick={closeMobileSidebar}
                            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl md:hidden dark:bg-slate-900"
                        >
                            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Menu</span>
                                <button onClick={closeMobileSidebar} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </div>
                            <nav className="flex-1 overflow-y-auto px-2 py-3">
                                <div className="space-y-0.5">
                                    <SidebarLink item={homeItem} collapsed={false} onClick={closeMobileSidebar} />
                                </div>
                                <div className="my-2 mx-2 border-t border-slate-100 dark:border-slate-800" />
                                <div className="space-y-0.5">
                                    {tabs.map((item) => (
                                        <SidebarLink key={item.to} item={item} collapsed={false} onClick={closeMobileSidebar} />
                                    ))}
                                </div>
                            </nav>
                            <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
                                <button
                                    onClick={() => {
                                        closeMobileSidebar()
                                        handleExit()
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                    <LogOut className="h-4 w-4 shrink-0" />
                                    <span>Log Out & Exit</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <main className="min-w-0 flex-1 overflow-y-auto bg-white dark:bg-slate-950">
                <div className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
                    {title && <PageHeader title={title} description={description} action={action} />}
                    {children}
                </div>
            </main>
        </div>
    )
}