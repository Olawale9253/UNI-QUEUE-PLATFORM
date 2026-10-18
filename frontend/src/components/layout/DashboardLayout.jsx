import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X as CloseIcon, Home as HomeIcon } from 'lucide-react'
import PageHeader from './PageHeader'
import Logo from '../ui/Logo'
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
                `group flex min-h-10 items-center rounded-xl py-2 text-sm font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                } ${
                    isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-slate-950/20 hover:bg-brand-500'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={`h-4 w-4 shrink-0 ${
                            isActive
                                ? 'text-white'
                                : 'text-slate-400 group-hover:text-white'
                        }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                </>
            )}
        </NavLink>
    )
}

export default function DashboardLayout({ tabs, title, description, action, children }) {
    const {
        sidebarCollapsed,
        mobileSidebarOpen,
        closeMobileSidebar,
    } = useUIStore()
    const { user } = useAuthStore()
    const location = useLocation()

    useEffect(() => {
        closeMobileSidebar()
    }, [location.pathname, closeMobileSidebar])

    useEffect(() => {
        document.body.style.overflow = mobileSidebarOpen ? 'hidden' : ''
        return () => {
            document.body.style.overflow = ''
        }
    }, [mobileSidebarOpen])

    const homeHref = user ? ROLE_HOME[user.role] || '/' : '/'

    const homeItem = {
        to: homeHref,
        label: 'Home',
        icon: HomeIcon,
        end: true,
    }

    return (
        <div className="dashboard-shell flex min-h-[calc(100vh-4rem)] w-full">
            <aside
                className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 self-start border-r border-[#18375b] bg-[#0b2545] text-slate-200 shadow-xl shadow-slate-900/10 transition-[width] duration-300 ease-out md:flex md:flex-col ${
                    sidebarCollapsed ? 'w-16' : 'w-60'
                }`}
            >
                <div
                    className={`flex h-[68px] shrink-0 items-center border-b border-white/10 ${
                        sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-5'
                    }`}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                        <Logo size={26} alt="UniQueue" />
                    </div>
                    {!sidebarCollapsed && (
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold tracking-tight text-white">UniQueue</p>
                            <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                                Workspace
                            </p>
                        </div>
                    )}
                </div>

                <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-5">
                    {!sidebarCollapsed && (
                        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                            Navigation
                        </p>
                    )}

                    <div className="space-y-1">
                        <SidebarLink item={homeItem} collapsed={sidebarCollapsed} />
                    </div>

                    <div className="my-4 mx-2 border-t border-white/10" />

                    <div className="space-y-1">
                        {tabs.map((item) => (
                            <SidebarLink
                                key={item.to}
                                item={item}
                                collapsed={sidebarCollapsed}
                            />
                        ))}
                    </div>
                </nav>
            </aside>

            <AnimatePresence>
                {mobileSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={closeMobileSidebar}
                            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[#18375b] bg-[#0b2545] text-slate-200 shadow-2xl md:hidden"
                        >
                            <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/10 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                                        <Logo size={26} alt="UniQueue" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold tracking-tight text-white">UniQueue</p>
                                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                                            Workspace
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeMobileSidebar}
                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                                    aria-label="Close menu"
                                >
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </div>

                            <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-5">
                                <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                    Navigation
                                </p>
                                <div className="space-y-1">
                                    <SidebarLink
                                        item={homeItem}
                                        collapsed={false}
                                        onClick={closeMobileSidebar}
                                    />
                                </div>

                                <div className="my-4 mx-2 border-t border-white/10" />

                                <div className="space-y-1">
                                    {tabs.map((item) => (
                                        <SidebarLink
                                            key={item.to}
                                            item={item}
                                            collapsed={false}
                                            onClick={closeMobileSidebar}
                                        />
                                    ))}
                                </div>
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <main className="min-w-0 flex-1">
                <div className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
                    {title && (
                        <PageHeader title={title} description={description} action={action} />
                    )}
                    {children}
                </div>
            </main>
        </div>
    )
}