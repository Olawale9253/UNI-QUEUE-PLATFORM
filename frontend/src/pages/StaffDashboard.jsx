import { Routes, Route, Navigate } from 'react-router-dom'
import { ListOrdered, Calendar } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import ServingQueue from './staff/ServingQueue'
import AppointmentSlots from './staff/AppointmentSlots'

const tabs = [
    { to: '/staff', label: 'Serving Queue', icon: ListOrdered, end: true },
    { to: '/staff/slots', label: 'Appointment Slots', icon: Calendar },
]

export default function StaffDashboard() {
    return (
        <DashboardLayout tabs={tabs}>
            <Routes>
                <Route index element={<ServingQueue />} />
                <Route path="slots" element={<AppointmentSlots />} />
                <Route path="*" element={<Navigate to="/staff" replace />} />
            </Routes>
        </DashboardLayout>
    )
}