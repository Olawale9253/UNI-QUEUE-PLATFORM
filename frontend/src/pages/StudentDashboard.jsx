import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, Ticket, History, Bell, User } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import StudentHome from './student/StudentHome'
import QueuesTab from './student/QueuesTab'
import HistoryTab from './student/HistoryTab'
import StudentSettings from './student/StudentSettings'

export default function StudentDashboard() {
    // Mapping your existing routes to the exact 5 items from the reference image
    const tabs = [
        { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student/queues', label: 'Join Queue', icon: Ticket },
        { to: '/student/history', label: 'My Tickets', icon: History },
        { to: '/student/notifications', label: 'Notifications', icon: Bell }, // Create a placeholder page if needed
        { to: '/student/settings', label: 'Profile', icon: User },
    ]

    return (
        <DashboardLayout tabs={tabs}>
            <Routes>
                <Route index element={<StudentHome />} />
                <Route path="queues" element={<QueuesTab />} />
                <Route path="history" element={<HistoryTab />} />
                {/* Add a placeholder for notifications or map it to an existing component */}
                <Route path="notifications" element={<div className="text-slate-500">Notifications coming soon.</div>} />
                <Route path="settings" element={<StudentSettings />} />
                <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
        </DashboardLayout>
    )
}