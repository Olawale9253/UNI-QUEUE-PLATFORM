import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const dashboards = {
    SUPER_ADMIN: '/super-admin',
    ADMIN: '/admin',
    STAFF: '/staff',
    USER: '/student',
    FRESHER: '/student',
}

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, token } = useAuthStore()

    // 1. No session at all → return to login without a full-page reload
    if (!token || !user) {
        return <Navigate to="/login" replace />
    }

    // 2. Logged in but email not verified → verification page.
    if (user.isVerified === false) {
        return (
            <Navigate
                to="/verify-email"
                replace
                state={{ email: user.email }}
            />
        )
    }

    // 3. Role gate (if the route requires specific roles)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={dashboards[user.role] || '/'} replace />
    }

    return children
}