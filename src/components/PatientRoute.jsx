import { useAuth } from '../hooks/useAuth'

export default function PatientRoute({ children }) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return children
}