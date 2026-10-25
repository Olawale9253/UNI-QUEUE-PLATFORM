import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    Building2, Users as UsersIcon, Activity,
    Settings as SettingsIcon,
    Shield, FileText, Megaphone, CreditCard, Clock,
    MessageSquare, Bell
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import PageHeader from '../components/layout/PageHeader'

import SuperAdminHome from './super-admin/SuperAdminHome'
import Universities from './super-admin/Universities'
import UniversityApplications from './super-admin/UniversityApplications'
import Users from './super-admin/Users'
import SystemAnalytics from './super-admin/SystemAnalytics'
import TiersAndFeatures from './super-admin/TiersAndFeatures'
import AuditLogs from './super-admin/AuditLogs'
import Settings from './super-admin/Settings'
import Broadcast from './super-admin/Broadcast'
import Plans from './super-admin/Plans'
import Feedback from './super-admin/Feedback'
import Notifications from './Notifications'
import Profile from './Profile'   // 👈 ADDED

const tabs = [
    { to: '/super-admin/universities', label: 'Universities', icon: Building2 },
    { to: '/super-admin/pending-requests', label: 'Pending Requests', icon: Clock },
    { to: '/super-admin/users', label: 'Users', icon: UsersIcon },
    { to: '/super-admin/feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/super-admin/analytics', label: 'System Analytics', icon: Activity },
    { to: '/super-admin/tiers', label: 'Tiers & Features', icon: Shield },
    { to: '/super-admin/plans', label: 'Plans', icon: CreditCard },
    { to: '/super-admin/broadcast', label: 'Broadcast', icon: Megaphone },
    { to: '/super-admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: FileText },
    { to: '/super-admin/settings', label: 'Settings', icon: SettingsIcon },
]

export default function SuperAdminDashboard() {
    const location = useLocation()
    const isHome = location.pathname === '/super-admin' || location.pathname === '/super-admin/'

    return (
        <DashboardLayout tabs={tabs}>
            {isHome && (
                <div className="sticky top-0 z-20 -mx-3 -mt-4 mb-4 bg-white px-3 pb-3 pt-4 dark:bg-slate-900 sm:-mx-5 sm:-mt-6 sm:px-5 sm:pt-6 sm:pb-4 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8 lg:pb-4">
                    <PageHeader
                        workspace="Platform Console"
                        description="Manage the entire UniQueue multi-tenant platform."
                    />
                </div>
            )}
            <Routes>
                <Route index element={<SuperAdminHome />} />
                <Route path="universities" element={<Universities />} />
                <Route path="pending-requests" element={<UniversityApplications />} />
                <Route path="users" element={<Users />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="analytics" element={<SystemAnalytics />} />
                <Route path="tiers" element={<TiersAndFeatures />} />
                <Route path="plans" element={<Plans />} />
                <Route path="broadcast" element={<Broadcast />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />   {/* 👈 ADDED */}
                <Route path="*" element={<Navigate to="/super-admin" replace />} />
            </Routes>
        </DashboardLayout>
    )
}