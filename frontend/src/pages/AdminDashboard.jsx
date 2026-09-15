import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import {
    LayoutGrid,
    BarChart3,
    Star,
    ListOrdered,
    Users,
    Route as RouteIcon,
    Settings as SettingsIcon,
} from 'lucide-react'
import Overview from './admin/Overview'
import Analytics from './admin/Analytics'
import Feedback from './admin/Feedback'
import Queues from './admin/Queues'
import Staff from './admin/Staff'
import Workflows from './admin/Workflows'
import Settings from './admin/Settings'

const tabs = [
    { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/feedback', label: 'Feedback', icon: Star },
    { to: '/admin/queues', label: 'Queues', icon: ListOrdered },
    { to: '/admin/staff', label: 'Staff', icon: Users },
    { to: '/admin/workflows', label: 'Workflows', icon: RouteIcon },
    { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

export default function AdminDashboard() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mb-6 border-b border-slate-200 sm:mb-8">
                <nav className="-mb-px flex gap-1 overflow-x-auto">
                    {tabs.map((t) => (
                        <NavLink
                            key={t.to}
                            to={t.to}
                            end={t.end}
                            className={({ isActive }) =>
                                `inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
                                    isActive
                                        ? 'border-brand-600 text-brand-600'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                }`
                            }
                        >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <Routes>
                <Route index element={<Overview />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="queues" element={<Queues />} />
                <Route path="staff" element={<Staff />} />
                <Route path="workflows" element={<Workflows />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </div>
    )
}