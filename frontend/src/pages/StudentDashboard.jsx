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
import ProfilePage from './student/ProfilePage'
import Notifications from './Notifications' // 🔧 Import here

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
        { to: '/student/notifications', label: 'Notifications', icon: Bell }, // 🔧 Point to sub-route
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
                <div className="sticky top-0 z-20 -mx-3 -mt-4 mb-4 bg-white px-3 pb-3 pt-4 dark:bg-slate-900 sm:-mx-5 sm:-mt-6 sm:px-5 sm:pt-6 sm:pb-4 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8 lg:pb-4">
                    <PageHeader
                        workspace="Student Workspace"
                        description="Join a queue, track your position, and manage your tickets."
                    />
                </div>
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
                <Route path="notifications" element={<Notifications />} /> {/* 🔧 Add route */}
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
        </DashboardLayout>
    )
}