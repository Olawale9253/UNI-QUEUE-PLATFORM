import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    ListOrdered, Calendar, CalendarCheck, Building2, FileText, Activity,
    User as UserIcon, Settings as SettingsIcon,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import PageHeader from '../components/layout/PageHeader'

import StaffHome from './staff/StaffHome'
import ServingQueue from './staff/ServingQueue'
import QueuesList from './staff/QueuesList'
import AppointmentSlots from './staff/AppointmentSlots'
import AppointmentsList from './staff/AppointmentsList'
import StaffDocuments from './staff/StaffDocuments'
import ActivityPage from './staff/ActivityPage'
import StaffProfile from './staff/StaffProfile'
import SettingsPage from './staff/SettingsPage'

const tabs = [
    { to: '/staff/serving', label: 'Serving Queue', icon: ListOrdered },
    { to: '/staff/queues', label: 'Services', icon: Building2 },
    { to: '/staff/slots', label: 'Manage Slots', icon: Calendar },
    { to: '/staff/appointments', label: 'Appointments', icon: CalendarCheck },
    { to: '/staff/documents', label: 'Documents', icon: FileText },
    { to: '/staff/activity', label: 'Activity', icon: Activity },
    { to: '/staff/profile', label: 'Profile', icon: UserIcon },
    { to: '/staff/settings', label: 'Settings', icon: SettingsIcon },
]

export default function StaffDashboard() {
    const location = useLocation()
    const isHome = location.pathname === '/staff' || location.pathname === '/staff/'

    return (
        <DashboardLayout tabs={tabs}>
            {isHome && (
                <PageHeader
                    workspace="Staff Workspace"
                    description="A live view of today's office operations."
                />
            )}
            <Routes>
                <Route index element={<StaffHome />} />
                <Route path="serving" element={<ServingQueue />} />
                <Route path="queues" element={<QueuesList />} />
                <Route path="slots" element={<AppointmentSlots />} />
                <Route path="appointments" element={<AppointmentsList />} />
                <Route path="documents" element={<StaffDocuments />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="profile" element={<StaffProfile />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/staff" replace />} />
            </Routes>
        </DashboardLayout>
    )
}