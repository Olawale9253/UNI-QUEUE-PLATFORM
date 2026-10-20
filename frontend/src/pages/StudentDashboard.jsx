import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    ListOrdered, History, Calendar, Route as RouteIcon, FileText, Building2,
    Settings, Ticket, Bell, User, Search,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import PageHeader from '../components/layout/PageHeader'

import StudentHome from './student/StudentHome'
import QueuesTab from './student/QueuesTab'
import OfficesTab from './student/OfficesTab'
import HistoryTab from './student/HistoryTab'
import AppointmentsTab from './student/AppointmentsTab'
import WorkflowsTab from './student/WorkflowsTab'
import MyClearancePage from './student/MyClearancePage'
import DocumentsTab from './student/DocumentsTab'
import StudentWorkflowProgress from './student/StudentWorkflowProgress'
import StudentSettings from './student/StudentSettings'
import JoinQueuePage from './student/JoinQueuePage'
import MyTicketsPage from './student/MyTicketsPage'
import NotificationsPage from './student/NotificationsPage'
import ProfilePage from './student/ProfilePage'

import { useUniversityStore } from '../store/universityStore'

export default function StudentDashboard() {
    const { university } = useUniversityStore()
    const location = useLocation()
    const isHome = location.pathname === '/student' || location.pathname === '/student/'

    const tabs = [
        { to: '/student/queues', label: 'Browse Queues', icon: ListOrdered },
        { to: '/student/offices', label: 'Offices', icon: Building2 },
        { to: '/student/history', label: 'History', icon: History },
        { to: '/student/join-queue', label: 'Join Queue', icon: Search },
        { to: '/student/my-tickets', label: 'My Tickets', icon: Ticket },
        { to: '/student/notifications', label: 'Notifications', icon: Bell },
        { to: '/student/profile', label: 'Profile', icon: User },
    ]

    if (!university || university.featureAppointments !== false) {
        tabs.push({ to: '/student/appointments', label: 'Appointments', icon: Calendar })
    }
    if (!university || university.featureWorkflows !== false) {
        tabs.push({ to: '/student/clearance', label: 'My Progress', icon: RouteIcon })
        tabs.push({ to: '/student/workflows', label: 'Workflows', icon: ListOrdered })
    }
    if (!university || university.featureDocuments !== false) {
        tabs.push({ to: '/student/documents', label: 'Documents', icon: FileText })
    }
    tabs.push({ to: '/student/settings', label: 'Settings', icon: Settings })

    return (
        <DashboardLayout tabs={tabs}>
            {isHome && (
                <PageHeader
                    workspace="Student Workspace"
                    description="Join a queue, track your position, and manage your tickets."
                />
            )}
            <Routes>
                <Route index element={<StudentHome />} />
                <Route path="queues" element={<QueuesTab />} />
                <Route path="offices" element={<OfficesTab />} />
                <Route path="history" element={<HistoryTab />} />
                <Route path="appointments" element={<AppointmentsTab />} />
                <Route path="workflows" element={<WorkflowsTab />} />
                <Route path="workflows/:id" element={<MyClearancePage />} />
                <Route path="clearance" element={<StudentWorkflowProgress />} />
                <Route path="documents" element={<DocumentsTab />} />
                <Route path="settings" element={<StudentSettings />} />
                <Route path="join-queue" element={<JoinQueuePage />} />
                <Route path="my-tickets" element={<MyTicketsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
        </DashboardLayout>
    )
}