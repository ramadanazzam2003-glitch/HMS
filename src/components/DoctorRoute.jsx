import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function DoctorRoute({ children }) {
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

  if (role && role !== 'doctor' && role !== 'admin' && role !== 'manager') {
    return <Navigate to="/dashboard" replace />
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
