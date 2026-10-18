import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Bell } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function StudentLayout() {
    const { user } = useAuthStore()
    const initials = user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'

    return (
        <div className="min-h-screen bg-slate-50">
            {/* The Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex min-h-screen flex-col md:pl-64">

                {/* Top Header */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-end border-b border-slate-200 bg-white px-4 shadow-sm sm:px-8">
                    <div className="flex items-center gap-4">
                        <button className="text-slate-400 hover:text-slate-600">
                            <Bell className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-900">{user?.fullName || 'Student'}</p>
                                <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() || 'Student'}</p>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                {initials}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content (Your existing pages will load here) */}
                <main className="flex-1 p-4 sm:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}