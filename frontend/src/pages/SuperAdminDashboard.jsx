import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    Building2, Users as UsersIcon, Activity,
    Settings as SettingsIcon,
    Shield, FileText, Megaphone, CreditCard, Clock
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

const tabs = [
    { to: '/super-admin/universities', label: 'Universities', icon: Building2 },
    { to: '/super-admin/pending-requests', label: 'Pending Requests', icon: Clock },
    { to: '/super-admin/users', label: 'Users', icon: UsersIcon },
    { to: '/super-admin/analytics', label: 'System Analytics', icon: Activity },
    { to: '/super-admin/tiers', label: 'Tiers & Features', icon: Shield },
    { to: '/super-admin/plans', label: 'Plans', icon: CreditCard },
    { to: '/super-admin/broadcast', label: 'Broadcast', icon: Megaphone },
    { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: FileText },
    { to: '/super-admin/settings', label: 'Settings', icon: SettingsIcon },
]

export default function SuperAdminDashboard() {
    const location = useLocation()
    // 🔧 Ensures the header ONLY shows on the exact Home route
    const isHome = location.pathname === '/super-admin' || location.pathname === '/super-admin/'

    return (
        <DashboardLayout tabs={tabs}>
            {isHome && (
                // 🔧 FIX: Changed bg-slate-50 to bg-white to match the navbar, added border-b
                <div className="sticky top-0 z-20 -mx-3 -mt-4 mb-4 bg-white border-b border-slate-200 px-3 pb-4 pt-5 dark:border-slate-800 dark:bg-slate-900 sm:-mx-5 sm:-mt-6 sm:px-5 sm:pt-7 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-9">
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
                <Route path="analytics" element={<SystemAnalytics />} />
                <Route path="tiers" element={<TiersAndFeatures />} />
                <Route path="plans" element={<Plans />} />
                <Route path="broadcast" element={<Broadcast />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/super-admin" replace />} />
            </Routes>
        </DashboardLayout>
    )
}