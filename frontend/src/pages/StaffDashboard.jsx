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
                <div className="sticky top-0 z-20 -mx-3 -mt-4 mb-4 bg-white px-3 pb-3 pt-4 dark:bg-slate-900 sm:-mx-5 sm:-mt-6 sm:px-5 sm:pt-6 sm:pb-4 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8 lg:pb-4">
                    <PageHeader
                        workspace="Staff Workspace"
                        description="A live view of today's office operations."
                    />
                </div>
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