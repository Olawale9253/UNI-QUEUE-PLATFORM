import { Routes, Route, Navigate } from 'react-router-dom'
import { ListOrdered, Calendar } from 'lucide-react'
import MobileTabSelect from '../components/layout/MobileTabSelect'
import ServingQueue from './staff/ServingQueue'
import AppointmentSlots from './staff/AppointmentSlots'

const tabs = [
    { to: '/staff', label: 'Serving Queue', icon: ListOrdered, end: true },
    { to: '/staff/slots', label: 'Appointment Slots', icon: Calendar },
]

export default function StaffDashboard() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <MobileTabSelect tabs={tabs} />

            <Routes>
                <Route index element={<ServingQueue />} />
                <Route path="slots" element={<AppointmentSlots />} />
                <Route path="*" element={<Navigate to="/staff" replace />} />
            </Routes>
        </div>
    )
}