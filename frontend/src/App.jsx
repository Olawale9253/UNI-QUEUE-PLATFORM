import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import ToastContainer from './components/ui/Toast'
import ErrorBoundary from './components/common/ErrorBoundary'
import ThemeProvider from './components/common/ThemeProvider'
import ImpersonationBanner from './components/layout/ImpersonationBanner'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Profile from './pages/Profile'
import StudentDashboard from './pages/StudentDashboard'
import StaffDashboard from './pages/StaffDashboard'
import AdminDashboard from './pages/AdminDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import NotFound from './pages/NotFound'
import { initSoundUnlock } from './lib/soundService'
import { usePrefsStore } from './store/prefsStore'
import { useServerEvents } from './hooks/useServerEvents'
import { useUniversityTheme } from './hooks/useUniversityTheme'
import PendingVerification from './pages/PendingVerification'

const AUTH_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
]

export default function App() {
    const location = useLocation()
    const hideNavbar = AUTH_ROUTES.includes(location.pathname)

    // Cross-device real-time: opens an SSE connection while authenticated.
    useServerEvents()

    // Themes the entire app with the current university's primary color
    // by overriding Tailwind's --color-brand-* CSS variables on <html>.
    useUniversityTheme()

    useEffect(() => {
        // Register click/keypress/touch listeners once at app boot.
        // Browsers block audio until the user has interacted at least once.
        initSoundUnlock()

        // Register the push service worker so subscriptions can be created later.
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.warn('SW registration failed:', err)
            })
        }

        // Load notification preferences for the logged-in user (if any).
        if (localStorage.getItem('uniqueue_token')) {
            usePrefsStore.getState().load()
        }
    }, [])

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                    <ImpersonationBanner />
                    {!hideNavbar && <Navbar />}
                    <main className="flex-1">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/pending-verification" element={<ProtectedRoute><PendingVerification /></ProtectedRoute>} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />

                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/student/*"
                                element={
                                    <ProtectedRoute allowedRoles={['USER', 'FRESHER']}>
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
            </ThemeProvider>
        </ErrorBoundary>
    )
}