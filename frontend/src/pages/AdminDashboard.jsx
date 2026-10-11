import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    LayoutGrid,
    BarChart3,
    Star,
    ListOrdered,
    Users,
    Route as RouteIcon,
    Settings as SettingsIcon,
    Building2,
    CalendarCheck,
    Activity,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import AdminHeader from '../components/admin/AdminHeader'
import AdminHome from './admin/AdminHome'
import Overview from './admin/Overview'
import Analytics from './admin/Analytics'
import Feedback from './admin/Feedback'
import Queues from './admin/Queues'
import Offices from './admin/Offices'
import Staff from './admin/Staff'
import Appointments from './admin/Appointments'
import Workflows from './admin/Workflows'
import Settings from './admin/Settings'
import Workload from './admin/Workload'

const tabs = [
    { to: '/admin/overview', label: 'Overview', icon: LayoutGrid },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/appointments', label: 'Appointments', icon: CalendarCheck },
    { to: '/admin/feedback', label: 'Feedback', icon: Star },
    { to: '/admin/queues', label: 'Services', icon: ListOrdered },
    { to: '/admin/offices', label: 'Offices', icon: Building2 },
    { to: '/admin/staff', label: 'Staff', icon: Users },
    { to: '/admin/workload', label: 'Workload', icon: Activity },
    { to: '/admin/workflows', label: 'Workflows', icon: RouteIcon },
    { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

const ROUTE_SUBTITLES = {
    '/admin': 'Everything you need to run your university today.',
    '/admin/overview': "A snapshot of what's happening across your university.",
    '/admin/analytics': 'Track wait times, service quality, and staff performance.',
    '/admin/appointments': 'Review and manage every appointment across your university.',
    '/admin/feedback': 'See what students are saying about your service.',
    '/admin/queues': 'Create and manage the services students can join.',
    '/admin/offices': 'Manage the offices that host your services.',
    '/admin/staff': 'Add staff, assign them to services, and manage accounts.',
    '/admin/workload': 'See where students are piling up vs how many staff serve them.',
    '/admin/workflows': 'Build multi-step clearance processes.',
    '/admin/settings': 'Configure your university branding, features, and limits.',
}

export default function AdminDashboard() {
    const location = useLocation()
    const subtitle = ROUTE_SUBTITLES[location.pathname] || 'Manage your university.'

    return (
        <DashboardLayout tabs={tabs}>
            <AdminHeader subtitle={subtitle} />
            <Routes>
                <Route index element={<AdminHome />} />
                <Route path="overview" element={<Overview />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="queues" element={<Queues />} />
                <Route path="offices" element={<Offices />} />
                <Route path="staff" element={<Staff />} />
                <Route path="workload" element={<Workload />} />
                <Route path="workflows" element={<Workflows />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </DashboardLayout>
    )
}