import { Routes, Route, Navigate } from 'react-router-dom'
import {
    LayoutDashboard,
    ListOrdered,
    Ticket,
    Bell,
    User,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'

// Import all your existing pages
import StudentHome from './student/StudentHome'
import OfficesTab from './student/OfficesTab'
import AppointmentsTab from './student/AppointmentsTab'
import WorkflowsTab from './student/WorkflowsTab'
import MyClearancePage from './student/MyClearancePage'
import DocumentsTab from './student/DocumentsTab'
import StudentWorkflowProgress from './student/StudentWorkflowProgress'
import StudentSettings from './student/StudentSettings'

// Import the NEW pages we created
import JoinQueuePage from './student/JoinQueuePage'
import MyTicketsPage from './student/MyTicketsPage'
import NotificationsPage from './student/NotificationsPage'
import ProfilePage from './student/ProfilePage'

export default function StudentDashboard() {
    // These are the EXACT 5 tabs from the image
    const tabs = [
        { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/student/queues', label: 'Join Queue', icon: ListOrdered },
        { to: '/student/my-tickets', label: 'My Tickets', icon: Ticket },
        { to: '/student/notifications', label: 'Notifications', icon: Bell },
        { to: '/student/profile', label: 'Profile', icon: User },
    ]

    return (
        <DashboardLayout tabs={tabs}>
            <Routes>
                {/* The main dashboard */}
                <Route index element={<StudentHome />} />

                {/* ⬇️ REPLACED OLD QueuesTab WITH NEW JoinQueuePage ⬇️ */}
                <Route path="queues" element={<JoinQueuePage />} />

                {/* ⬇️ NEW ROUTES FOR THE NEW PAGES ⬇️ */}
                <Route path="my-tickets" element={<MyTicketsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />

                {/* These routes are hidden from the sidebar but still accessible if a user has a direct link */}
                <Route path="offices" element={<OfficesTab />} />
                <Route path="appointments" element={<AppointmentsTab />} />
                <Route path="workflows" element={<WorkflowsTab />} />
                <Route path="workflows/:id" element={<MyClearancePage />} />
                <Route path="clearance" element={<StudentWorkflowProgress />} />
                <Route path="documents" element={<DocumentsTab />} />
                <Route path="settings" element={<StudentSettings />} />

                <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
        </DashboardLayout>
    )
}