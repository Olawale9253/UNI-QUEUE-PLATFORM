import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    LayoutGrid, BarChart3, Star, ListOrdered, Users, Route as RouteIcon,
    Settings as SettingsIcon, Building2, CalendarCheck, Activity, History,
    ShieldCheck, GraduationCap,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import PageHeader from '../components/layout/PageHeader'

import AdminHome from './admin/AdminHome'
import Overview from './admin/Overview'
import Analytics from './admin/Analytics'
import Feedback from './admin/Feedback'
import Queues from './admin/Queues'
import Offices from './admin/Offices'
import Staff from './admin/Staff'
import Appointments from './admin/Appointments'
import Workflows from './admin/Workflows'
import Workload from './admin/Workload'
import AuditLog from './admin/AuditLog'
import Settings from './admin/Settings'
import Verification from './admin/Verification'
import Students from './admin/Students'

const tabs = [
    { to: '/admin/overview', label: 'Live Overview', icon: LayoutGrid },
    { to: '/admin/analytics', label: 'Reports & Trends', icon: BarChart3 },
    { to: '/admin/appointments', label: 'Appointments', icon: CalendarCheck },
    { to: '/admin/feedback', label: 'Feedback', icon: Star },
    { to: '/admin/queues', label: 'Services', icon: ListOrdered },
    { to: '/admin/offices', label: 'Offices', icon: Building2 },
    { to: '/admin/staff', label: 'Staff', icon: Users },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/workload', label: 'Workload', icon: Activity },
    { to: '/admin/workflows', label: 'Workflows', icon: RouteIcon },
    { to: '/admin/verification', label: 'Verifications', icon: ShieldCheck },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: History },
    { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

export default function AdminDashboard() {
    const location = useLocation()
    const isHome = location.pathname === '/admin' || location.pathname === '/admin/'

    return (
        <DashboardLayout tabs={tabs}>
            {isHome && (
                <div className="sticky top-0 z-20 -mx-3 -mt-4 mb-4 bg-white px-3 pb-3 pt-4 dark:bg-slate-900 sm:-mx-5 sm:-mt-6 sm:px-5 sm:pt-6 sm:pb-4 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8 lg:pb-4">
                    <PageHeader
                        workspace="Admin Workspace"
                        description="Everything you need to run your university today."
                    />
                </div>
            )}
            <Routes>
                <Route index element={<AdminHome />} />
                <Route path="overview" element={<Overview />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="queues" element={<Queues />} />
                <Route path="offices" element={<Offices />} />
                <Route path="staff" element={<Staff />} />
                <Route path="students" element={<Students />} />
                <Route path="workload" element={<Workload />} />
                <Route path="workflows" element={<Workflows />} />
                <Route path="verification" element={<Verification />} />
                <Route path="audit-logs" element={<AuditLog />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </DashboardLayout>
    )
}