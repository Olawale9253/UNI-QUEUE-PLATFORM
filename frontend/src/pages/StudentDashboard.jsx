import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
    ListOrdered,
    History,
    Calendar,
    Route as RouteIcon,
    FileText,
    Building2,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import StudentHeader from '../components/student/StudentHeader'
import StudentHome from './student/StudentHome'
import QueuesTab from './student/QueuesTab'
import OfficesTab from './student/OfficesTab'
import HistoryTab from './student/HistoryTab'
import AppointmentsTab from './student/AppointmentsTab'
import WorkflowsTab from './student/WorkflowsTab'
import DocumentsTab from './student/DocumentsTab'
import { useUniversityStore } from '../store/universityStore'

const ROUTE_SUBTITLES = {
    '/student': "Skip the line — join a queue from anywhere and get notified when it's your turn.",
    '/student/queues': 'Join a queue, track your position, and manage your tickets.',
    '/student/offices': 'Browse every office and the services it offers.',
    '/student/history': 'Your past queue tickets and how long you waited.',
    '/student/appointments': 'Book and manage your appointments.',
    '/student/workflows': 'Track your multi-step clearance processes.',
    '/student/documents': 'Your uploaded documents.',
}

export default function StudentDashboard() {
    const { university } = useUniversityStore()
    const location = useLocation()

    const tabs = [
        { to: '/student/queues', label: 'Queues', icon: ListOrdered },
        { to: '/student/offices', label: 'Offices', icon: Building2 },
        { to: '/student/history', label: 'History', icon: History },
    ]

    if (!university || university.featureAppointments !== false) {
        tabs.push({ to: '/student/appointments', label: 'Appointments', icon: Calendar })
    }
    if (!university || university.featureWorkflows !== false) {
        tabs.push({ to: '/student/workflows', label: 'Workflows', icon: RouteIcon })
    }
    if (!university || university.featureDocuments !== false) {
        tabs.push({ to: '/student/documents', label: 'Documents', icon: FileText })
    }

    const subtitle =
        ROUTE_SUBTITLES[location.pathname] || 'Everything you need for today.'

    return (
        <DashboardLayout tabs={tabs}>
            <StudentHeader subtitle={subtitle} />
            <Routes>
                <Route index element={<StudentHome />} />
                <Route path="queues" element={<QueuesTab />} />
                <Route path="offices" element={<OfficesTab />} />
                <Route path="history" element={<HistoryTab />} />
                <Route path="appointments" element={<AppointmentsTab />} />
                <Route path="workflows" element={<WorkflowsTab />} />
                <Route path="documents" element={<DocumentsTab />} />
                <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
        </DashboardLayout>
    )
}