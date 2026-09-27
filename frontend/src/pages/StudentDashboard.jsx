import { Routes, Route, Navigate } from 'react-router-dom'
import {
    ListOrdered,
    History,
    Calendar,
    Route as RouteIcon,
    FileText,
    Building2,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import StudentHome from './student/StudentHome'
import QueuesTab from './student/QueuesTab'
import OfficesTab from './student/OfficesTab'
import HistoryTab from './student/HistoryTab'
import AppointmentsTab from './student/AppointmentsTab'
import WorkflowsTab from './student/WorkflowsTab'
import DocumentsTab from './student/DocumentsTab'
import { useUniversityStore } from '../store/universityStore'

export default function StudentDashboard() {
    const { university } = useUniversityStore()

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

    return (
        <DashboardLayout tabs={tabs}>
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