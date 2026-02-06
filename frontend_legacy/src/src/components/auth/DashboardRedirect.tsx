/**
 * DashboardRedirect - Automatically routes users to the appropriate dashboard
 * based on their role (superuser vs tenant user)
 */
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function DashboardRedirect() {
    const user = useAuthStore(state => state.user)

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Superusers go to admin dashboard
    if (user.is_superuser) {
        return <Navigate to="/admin/dashboard" replace />
    }

    // Regular tenant users go to standard dashboard
    return <Navigate to="/dashboard" replace />
}
