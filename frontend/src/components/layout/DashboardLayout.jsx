import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X as CloseIcon, Home as HomeIcon, LogOut, Menu, Search, Bell, ChevronDown } from 'lucide-react'
import PageHeader from './PageHeader'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'
import { withAlpha } from '../../lib/colors'

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
                `group flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors ${
                    collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                } ${
                    isActive
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
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
                    {!collapsed && <span className="truncate">{item.label}</span>}
                </>
            )}
        </NavLink>
    )
}

export default function DashboardLayout({ tabs, title, description, action, children }) {
    const { sidebarCollapsed, mobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useUIStore()
    const { user, logout } = useAuthStore()
    const { university } = useUniversityStore()
    const location = useLocation()
    const navigate = useNavigate()

    const primaryColor = university?.primaryColor || '#0ea5e9'

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
        <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* DESKTOP SIDEBAR (DARK NAVY) */}
            <aside
                className={`hidden h-full shrink-0 flex-col overflow-hidden bg-[#0f172a] transition-[width] duration-300 ease-out md:flex ${
                    sidebarCollapsed ? 'w-16' : 'w-64'
                }`}
            >
                {/* Logo Area */}
                <div className={`flex h-16 shrink-0 items-center border-b border-slate-800 px-4 ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                        <HomeIcon className="h-5 w-5" />
                    </div>
                    {!sidebarCollapsed && (
                        <div>
                            <div className="text-sm font-bold text-white leading-tight">UniQueue</div>
                            <div className="text-[10px] text-slate-400">Skip the line, get things done</div>
                        </div>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    <SidebarLink item={homeItem} collapsed={sidebarCollapsed} />
                    {tabs.map((item) => (
                        <SidebarLink key={item.to} item={item} collapsed={sidebarCollapsed} />
                    ))}
                </nav>

                {/* Bottom Area */}
                <div className="shrink-0 p-4 border-t border-slate-800 text-center">
                    {!sidebarCollapsed && (
                        <div className="mb-4 text-[10px] text-slate-500">
                            <p>Ladoke Akintola University</p>
                            <p>of Technology (LAUTECH)</p>
                        </div>
                    )}
                    <button
                        onClick={handleExit}
                        className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {!sidebarCollapsed && <span>Log Out</span>}
                    </button>
                </div>
            </aside>

            {/* MOBILE SIDEBAR */}
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
                            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#0f172a] shadow-2xl md:hidden"
                        >
                            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                                        <HomeIcon className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-bold text-white">UniQueue</span>
                                </div>
                                <button onClick={closeMobileSidebar} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800">
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </div>
                            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                                <SidebarLink item={homeItem} collapsed={false} onClick={closeMobileSidebar} />
                                {tabs.map((item) => (
                                    <SidebarLink key={item.to} item={item} collapsed={false} onClick={closeMobileSidebar} />
                                ))}
                            </nav>
                            <div className="shrink-0 border-t border-slate-800 p-4">
                                <button
                                    onClick={() => { closeMobileSidebar(); handleExit(); }}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10"
                                >
                                    <LogOut className="h-4 w-4" /> Log Out
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA */}
            <main className="min-w-0 flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">

                {/* TOP HEADER BAR */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={toggleMobileSidebar} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                            <Menu className="h-5 w-5" />
                        </button>

                        {/* Search Input */}
                        <div className="relative hidden sm:block max-w-md w-full">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search queues, offices, or services..."
                                className="w-full rounded-full bg-slate-100 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-slate-600"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900"></span>
                        </button>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <div className="flex items-center gap-3 cursor-pointer">
                            <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs uppercase">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="hidden sm:block text-sm">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user?.fullName}</p>
                                <p className="text-[11px] text-slate-500 capitalize">{user?.role?.toLowerCase()}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                        {title && <PageHeader title={title} description={description} action={action} />}
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}