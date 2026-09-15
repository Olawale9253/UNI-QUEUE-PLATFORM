import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import {
    ListOrdered,
    History,
    Calendar,
    Route as RouteIcon,
    FileText,
} from 'lucide-react'
import QueuesTab from './student/QueuesTab'
import HistoryTab from './student/HistoryTab'
import AppointmentsTab from './student/AppointmentsTab'
import WorkflowsTab from './student/WorkflowsTab'
import DocumentsTab from './student/DocumentsTab'

const tabs = [
    { to: '/student', label: 'Queues', icon: ListOrdered, end: true },
    { to: '/student/history', label: 'History', icon: History },
    { to: '/student/appointments', label: 'Appointments', icon: Calendar },
    { to: '/student/workflows', label: 'Workflows', icon: RouteIcon },
    { to: '/student/documents', label: 'Documents', icon: FileText },
]

export default function StudentDashboard() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mb-6 border-b border-slate-200 sm:mb-8">
                <nav className="-mb-px flex gap-1 overflow-x-auto">
                    {tabs.map((t) => (
                        <NavLink
                            key={t.to}
                            to={t.to}
                            end={t.end}
                            className={({ isActive }) =>
                                `inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
                                    isActive
                                        ? 'border-brand-600 text-brand-600'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                }`
                            }
                        >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

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