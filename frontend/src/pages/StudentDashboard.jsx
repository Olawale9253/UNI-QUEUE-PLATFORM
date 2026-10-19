import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    ListOrdered,
    History,
    Calendar,
    Route as RouteIcon,
    FileText,
    Building2,
    Settings,
    Ticket,   // New
    Bell,     // New
    User,     // New
    Search,   // New
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import StudentHeader from '../components/student/StudentHeader'

// --- YOUR EXISTING PAGES ---
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

// --- NEW PAGES ---
import JoinQueuePage from './student/JoinQueuePage'
import MyTicketsPage from './student/MyTicketsPage'
import NotificationsPage from './student/NotificationsPage'
import ProfilePage from './student/ProfilePage'

import { useUniversityStore } from '../store/universityStore'

const ROUTE_SUBTITLES = {
    '/student': "Skip the line. Join a queue from anywhere and get notified when it's your turn.",
    '/student/queues': 'Join a queue, track your position, and manage your tickets.',
    '/student/offices': 'Browse every office and the services it offers.',
    '/student/history': 'Your past queue tickets and how long you waited.',
    '/student/appointments': 'Book and manage your appointments.',
    '/student/clearance': 'Your current progress and what to do next.',
    '/student/workflows': 'Browse and start any clearance process open to you.',
    '/student/documents': 'Your uploaded documents.',
    '/student/settings': 'Manage your profile, security, and preferences.',
    // New Routes
    '/student/join-queue': 'Select a service and join the queue instantly.',
    '/student/my-tickets': 'Track your live queue position and view history.',
    '/student/notifications': 'All your alerts and queue updates.',
    '/student/profile': 'Your personal details and account information.',
}

export default function StudentDashboard() {
    const { university } = useUniversityStore()
    const location = useLocation()

    const tabs = [
        // --- YOUR EXISTING TABS ---
        { to: '/student/queues', label: 'Browse Queues', icon: ListOrdered },
        { to: '/student/offices', label: 'Offices', icon: Building2 },
        { to: '/student/history', label: 'History', icon: History },

        // --- NEW TABS ADDED HERE ---
        { to: '/student/join-queue', label: 'Join Queue', icon: Search },
        { to: '/student/my-tickets', label: 'My Tickets', icon: Ticket },
        { to: '/student/notifications', label: 'Notifications', icon: Bell },
        { to: '/student/profile', label: 'Profile', icon: User },
    ]

    // Keep your existing conditional logic for these tabs
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

    const subtitle = (() => {
        if (location.pathname === '/student/clearance') {
            return 'Your current progress and what to do next.'
        }
        if (location.pathname.startsWith('/student/workflows/')) {
            return 'Track your progress through this clearance step by step.'
        }
        return ROUTE_SUBTITLES[location.pathname] || 'Everything you need for today.'
    })()

    return (
        <DashboardLayout tabs={tabs}>
            <StudentHeader subtitle={subtitle} />
            <Routes>
                {/* --- YOUR EXISTING ROUTES --- */}
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

                {/* --- NEW ROUTES ADDED HERE --- */}
                <Route path="join-queue" element={<JoinQueuePage />} />
                <Route path="my-tickets" element={<MyTicketsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />

                <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
        </DashboardLayout>
    )
}