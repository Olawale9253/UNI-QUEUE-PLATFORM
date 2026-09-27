import { Routes, Route, Navigate } from 'react-router-dom'
import {
    ListOrdered,
    Calendar,
    CalendarCheck,
    Building2,
    Activity,
    User as UserIcon,
    Settings as SettingsIcon,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import StaffHome from './staff/StaffHome'
import ServingQueue from './staff/ServingQueue'
import QueuesList from './staff/QueuesList'
import AppointmentSlots from './staff/AppointmentSlots'
import AppointmentsList from './staff/AppointmentsList'
import ActivityPage from './staff/ActivityPage'
import StaffProfile from './staff/StaffProfile'
import SettingsPage from './staff/SettingsPage'

const tabs = [
    { to: '/staff/serving', label: 'Serving Queue', icon: ListOrdered },
    { to: '/staff/queues', label: 'All Queues', icon: Building2 },
    { to: '/staff/slots', label: 'Appointment Slots', icon: Calendar },
    { to: '/staff/appointments', label: 'Appointments', icon: CalendarCheck },
    { to: '/staff/activity', label: 'Activity', icon: Activity },
    { to: '/staff/profile', label: 'Profile', icon: UserIcon },
    { to: '/staff/settings', label: 'Settings', icon: SettingsIcon },
]

export default function StaffDashboard() {
    return (
        <DashboardLayout tabs={tabs}>
            <Routes>
                <Route index element={<StaffHome />} />
                <Route path="serving" element={<ServingQueue />} />
                <Route path="queues" element={<QueuesList />} />
                <Route path="slots" element={<AppointmentSlots />} />
                <Route path="appointments" element={<AppointmentsList />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="profile" element={<StaffProfile />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/staff" replace />} />
            </Routes>
        </DashboardLayout>
    )
}