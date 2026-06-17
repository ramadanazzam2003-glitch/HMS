import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function DoctorRoute({ children }) {
  const { user, role, loading } = useAuth()

  if (!user && !loading) {
    return <Navigate to="/login" replace />
  }

  if (user && role) {
    if (role !== 'doctor' && role !== 'admin' && role !== 'manager') {
      return <Navigate to="/dashboard" replace />
    }
    return children
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-400">Loading...</div>
    </div>
  )
}
