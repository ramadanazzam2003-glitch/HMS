import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, role, loading } = useAuth()

  if (!user) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-400">Loading...</div>
        </div>
      )
    }
    return <Navigate to="/login" replace />
  }

  const staffRoles = ['manager', 'admin', 'director', 'dept_manager', 'doctor', 'nurse', 'receptionist']

  if (role && !staffRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  if (!role && loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return children
}
