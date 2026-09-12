import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const dashboards = {
    SUPER_ADMIN: '/super-admin',
    ADMIN: '/admin',
    STAFF: '/staff',
    USER: '/student',
}

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, token } = useAuthStore()

    if (!token || !user) return <Navigate to="/login" replace />
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={dashboards[user.role] || '/'} replace />
    }
    return children
}