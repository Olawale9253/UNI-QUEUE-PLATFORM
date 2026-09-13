import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import ToastContainer from './components/ui/Toast'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import StaffDashboard from './pages/StaffDashboard'
import AdminDashboard from './pages/AdminDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import NotFound from './pages/NotFound'

// Routes where the main navbar should be hidden (auth pages have their own branding)
const AUTH_ROUTES = ['/login', '/register']

export default function App() {
    const location = useLocation()
    const hideNavbar = AUTH_ROUTES.includes(location.pathname)

    return (
        <ErrorBoundary>
            <div className="flex min-h-screen flex-col bg-slate-50">
                {!hideNavbar && <Navbar />}
                <main className="flex-1">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route
                            path="/student/*"
                            element={
                                <ProtectedRoute allowedRoles={['USER']}>
                                    <StudentDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/staff/*"
                            element={
                                <ProtectedRoute allowedRoles={['STAFF']}>
                                    <StaffDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/*"
                            element={
                                <ProtectedRoute allowedRoles={['ADMIN']}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/super-admin/*"
                            element={
                                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                                    <SuperAdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
                <ToastContainer />
            </div>
        </ErrorBoundary>
    )
}