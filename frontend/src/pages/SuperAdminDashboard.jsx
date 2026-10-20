import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    Building2, Users as UsersIcon, Activity,
    Settings as SettingsIcon,
    Shield, FileText, Megaphone, CreditCard,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import PageHeader from '../components/layout/PageHeader'

// Actual files you have in src/pages/super-admin/
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
    const isHome = location.pathname === '/super-admin' || location.pathname === '/super-admin/'

    return (
        <DashboardLayout tabs={tabs}>
            {isHome && (
                <PageHeader
                    workspace="Platform Console"
                    description="Manage the entire UniQueue multi-tenant platform."
                />
            )}
            <Routes>
                <Route index element={<Navigate to="/super-admin/analytics" replace />} />
                <Route path="universities" element={<UniversityApplications />} />
                <Route path="users" element={<Users />} />
                <Route path="analytics" element={<SystemAnalytics />} />
                <Route path="tiers" element={<TiersAndFeatures />} />
                <Route path="plans" element={<Plans />} />
                <Route path="broadcast" element={<Broadcast />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/super-admin/analytics" replace />} />
            </Routes>
        </DashboardLayout>
    )
}