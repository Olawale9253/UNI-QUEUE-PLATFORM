import { Routes, Route, Navigate } from 'react-router-dom'
import {
    ListOrdered,
    History,
    Calendar,
    Route as RouteIcon,
    FileText,
} from 'lucide-react'
import MobileTabSelect from '../components/layout/MobileTabSelect'
import QueuesTab from './student/QueuesTab'
import HistoryTab from './student/HistoryTab'
import AppointmentsTab from './student/AppointmentsTab'
import WorkflowsTab from './student/WorkflowsTab'
import DocumentsTab from './student/DocumentsTab'
import { useUniversityStore } from '../store/universityStore'

export default function StudentDashboard() {
    const { university } = useUniversityStore()

    const tabs = [
        { to: '/student', label: 'Queues', icon: ListOrdered, end: true },
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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <MobileTabSelect tabs={tabs} />

            <Routes>
                <Route index element={<QueuesTab />} />
                <Route path="history" element={<HistoryTab />} />
                <Route path="appointments" element={<AppointmentsTab />} />
                <Route path="workflows" element={<WorkflowsTab />} />
                <Route path="documents" element={<DocumentsTab />} />
                <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
        </div>
    )
}