import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Ticket, LogOut, Bell, User, PlusCircle,
    Layers // ⬅️ Example icon for a custom page
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Logo from '../ui/Logo'

const NAV_ITEMS = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/join', label: 'Join Queue', icon: PlusCircle },
    { to: '/student/tickets', label: 'My Tickets', icon: Ticket },

    // ⬇️ ADD YOUR CUSTOM EXISTING PAGES HERE ⬇️
    // { to: '/student/workflows', label: 'Workflows', icon: Layers },

    { to: '/student/notifications', label: 'Notifications', icon: Bell },
    { to: '/student/profile', label: 'Profile', icon: User },
]

export default function Sidebar() {
    const { logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#0A192F] text-slate-300 md:flex">
            {/* Logo Area */}
            <div className="flex h-16 items-center gap-3 px-6 text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <Logo size={20} variant="icon" />
                </div>
                <span className="text-lg font-bold tracking-tight">UniQueue</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </div>
                            {/* Notification Badge */}
                            {item.label === 'Notifications' && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                                    2
                                </span>
                            )}
                        </NavLink>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="p-3">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                >
                    <LogOut className="h-5 w-5" />
                    Log Out
                </button>
            </div>
        </aside>
    )
}