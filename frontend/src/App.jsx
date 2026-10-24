import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import ToastContainer from './components/ui/Toast'
import ErrorBoundary from './components/common/ErrorBoundary'
import ThemeProvider from './components/common/ThemeProvider'
import ImpersonationBanner from './components/layout/ImpersonationBanner'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ScrollToTop from './components/common/ScrollToTop'
import IdleTimeout from './components/common/IdleTimeout'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SetupAccount from './pages/SetupAccount'
import VerifyEmail from './pages/VerifyEmail'
import Profile from './pages/Profile'
import StudentDashboard from './pages/StudentDashboard'
import StaffDashboard from './pages/StaffDashboard'
import AdminDashboard from './pages/AdminDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import NotFound from './pages/NotFound'
import PendingVerification from './pages/PendingVerification'
import PublicRegisterUniversity from './pages/PublicRegisterUniversity'
import { initSoundUnlock } from './lib/soundService'
import { usePrefsStore } from './store/prefsStore'
import { useServerEvents } from './hooks/useServerEvents'
import { useUniversityTheme } from './hooks/useUniversityTheme'

const HIDE_NAVBAR_ROUTES = [
    '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/setup-account',
]

export default function App() {
    const location = useLocation()
    const hideNavbar = HIDE_NAVBAR_ROUTES.some(route => location.pathname.startsWith(route))

    useServerEvents()
    useUniversityTheme()

    useEffect(() => {
        initSoundUnlock()
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('SW registration failed:', err))
        }
        if (localStorage.getItem('uniqueue_token')) {
            usePrefsStore.getState().load()
        }
    }, [])

    useEffect(() => {
        const onPageShow = (event) => { if (event.persisted) window.location.reload() }
        window.addEventListener('pageshow', onPageShow)
        return () => window.removeEventListener('pageshow', onPageShow)
    }, [])

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <IdleTimeout />
                {/* 🔧 FIX: h-full relies on index.css forcing html/body/#root to 100% and overflow-hidden */}
                <div className="flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                    <ScrollToTop />
                    <ImpersonationBanner />
                    {!hideNavbar && <Navbar />}
                    <main className="flex-1 overflow-hidden">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/for-universities" element={<PublicRegisterUniversity />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/setup-account" element={<SetupAccount />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            <Route path="/pending-verification" element={<ProtectedRoute><PendingVerification /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                            <Route path="/student/*" element={<ProtectedRoute allowedRoles={['USER', 'FRESHER']}><StudentDashboard /></ProtectedRoute>} />
                            <Route path="/staff/*" element={<ProtectedRoute allowedRoles={['STAFF']}><StaffDashboard /></ProtectedRoute>} />
                            <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                            <Route path="/super-admin/*" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </main>
                    <ToastContainer />
                </div>
            </ThemeProvider>
        </ErrorBoundary>
    )
}