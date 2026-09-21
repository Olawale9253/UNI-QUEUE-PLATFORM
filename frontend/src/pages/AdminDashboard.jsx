import { Routes, Route, Navigate } from 'react-router-dom'
import {
    LayoutGrid,
    BarChart3,
    Star,
    ListOrdered,
    Users,
    Route as RouteIcon,
    Settings as SettingsIcon,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
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
        <DashboardLayout tabs={tabs}>
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
        </DashboardLayout>
    )
}