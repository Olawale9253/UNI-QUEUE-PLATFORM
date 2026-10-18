import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, LogOut, GraduationCap, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUniversityStore } from '../../store/universityStore'

export default function DashboardLayout({ children, tabs }) {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const { university } = useUniversityStore()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex h-screen w-full bg-[#f8fafc]">
            {/* Sidebar */}
            <aside className="flex w-64 flex-col bg-[#0f172a] text-white">
                {/* Logo Area */}
                <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">UniFlow</h1>
                        <p className="text-[10px] text-slate-400">Student Portal</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {tabs.map((tab) => {
                        // Match exact path for index, or startsWith for nested routes
                        const isActive = tab.to === '/student'
                            ? location.pathname === '/student' || location.pathname === '/student/'
                            : location.pathname.startsWith(tab.to)

                        return (
                            <Link
                                key={tab.to}
                                to={tab.to}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <tab.icon className="h-4.5 w-4.5" />
                                {tab.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div className="border-t border-slate-800 p-3">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                    >
                        <LogOut className="h-4.5 w-4.5" />
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
                    {/* Search */}
                    <div className="flex w-96 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search for a service..."
                            className="ml-2 w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
                        />
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-6">
                        <button className="relative text-slate-400 hover:text-slate-600">
                            <Bell className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                3
                            </span>
                        </button>
                        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-slate-900">{user?.fullName || 'Student'}</p>
                                <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() || 'Student'}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}