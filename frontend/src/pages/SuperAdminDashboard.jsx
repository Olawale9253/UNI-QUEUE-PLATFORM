import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Building2, Users, Activity, Settings, Shield, FileText
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import PageHeader from '../components/layout/PageHeader'

import SuperAdminHome from './super-admin/SuperAdminHome'
import Universities from './super-admin/Universities'
import Admins from './super-admin/Admins'
import SystemAnalytics from './super-admin/SystemAnalytics'
import Settings from './super-admin/Settings'
import AuditLogs from './super-admin/AuditLogs'
import TiersAndFeatures from './super-admin/TiersAndFeatures'

const tabs = [
    { to: '/super-admin/universities', label: 'Universities', icon: Building2 },
    { to: '/super-admin/admins', label: 'Admins', icon: Users },
    { to: '/super-admin/analytics', label: 'System Analytics', icon: Activity },
    { to: '/super-admin/tiers', label: 'Tiers & Features', icon: Shield },
    { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: FileText },
    { to: '/super-admin/settings', label: 'Settings', icon: Settings },
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
                <Route index element={<SuperAdminHome />} />
                <Route path="universities" element={<Universities />} />
                <Route path="admins" element={<Admins />} />
                <Route path="analytics" element={<SystemAnalytics />} />
                <Route path="tiers" element={<TiersAndFeatures />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/super-admin" replace />} />
            </Routes>
        </DashboardLayout>
    )
}