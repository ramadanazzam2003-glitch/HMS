import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, role, loading } = useAuth()

  if (!user && !loading) {
    return <Navigate to="/login" replace />
  }

  if (user && role) {
    const staffRoles = ['super_admin', 'manager', 'admin', 'director', 'dept_manager', 'doctor', 'nurse', 'receptionist']
    if (!staffRoles.includes(role)) {
      return <Navigate to="/" replace />
    }
    return children
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-400">Loading...</div>
    </div>
  )
}
