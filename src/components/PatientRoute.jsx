import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PatientRoute({ children }) {
  const { user, role, loading } = useAuth()

  if (!user && !loading) {
    return <Navigate to="/login" replace />
  }

  if (user) {
    return children
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-400">Loading...</div>
    </div>
  )
}
