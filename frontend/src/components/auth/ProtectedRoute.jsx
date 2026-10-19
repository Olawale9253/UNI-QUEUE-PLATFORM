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

    // 1. No session at all → hard reload to login
    if (!token || !user) {
        // Use window.location.replace instead of <Navigate> to force a hard wipe
        // of any cached React state/DOM. This stops the "Forward" button exploit.
        window.location.replace('/login')
        return null
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