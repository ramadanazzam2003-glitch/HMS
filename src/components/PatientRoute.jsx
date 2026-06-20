import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PatientRoute({ children }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const staffRoutes = {
    doctor: '/doctor',
    nurse: '/nurse/triage',
    receptionist: '/receptionist',
    admin: '/dashboard',
    manager: '/dashboard',
    director: '/dashboard',
    dept_manager: '/dashboard',
    super_admin: '/dashboard',
  }

  if (role && staffRoutes[role]) {
    return <Navigate to={staffRoutes[role]} replace />
  }

  return children
}