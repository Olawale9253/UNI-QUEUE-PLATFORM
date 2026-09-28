import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    ListOrdered,
    Calendar,
    CalendarCheck,
    Building2,
    FileText,
    Activity,
    User as UserIcon,
    Settings as SettingsIcon,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import StaffHeader from '../components/staff/StaffHeader'
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
    { to: '/staff/serving', label: 'Queue Management', icon: ListOrdered },
    { to: '/staff/queues', label: 'All Queues', icon: Building2 },
    { to: '/staff/slots', label: 'Appointment Slots', icon: Calendar },
    { to: '/staff/appointments', label: 'Appointments', icon: CalendarCheck },
    { to: '/staff/documents', label: 'Documents', icon: FileText },
    { to: '/staff/activity', label: 'My Activity', icon: Activity },
    { to: '/staff/profile', label: 'My Profile', icon: UserIcon },
    { to: '/staff/settings', label: 'Settings', icon: SettingsIcon },
]

const ROUTE_SUBTITLES = {
    '/staff': "A live view of today's office operations.",
    '/staff/serving': 'Call the next ticket and serve students.',
    '/staff/queues': 'Browse every service across your university.',
    '/staff/slots': 'Set your bookable time slots.',
    '/staff/appointments': 'Appointments students booked with you.',
    '/staff/documents': 'Review and process document requests.',
    '/staff/activity': 'Your service history and productivity.',
    '/staff/profile': 'Your account details and preferences.',
    '/staff/settings': 'Personal preferences for your workspace.',
}

export default function StaffDashboard() {
    const location = useLocation()
    const subtitle =
        ROUTE_SUBTITLES[location.pathname] || 'Your staff workspace.'

    return (
        <DashboardLayout tabs={tabs}>
            <StaffHeader subtitle={subtitle} />
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