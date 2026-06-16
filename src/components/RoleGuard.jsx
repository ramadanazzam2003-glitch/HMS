import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUI } from '../hooks/useUI'

export default function RoleGuard({ children, allowedRoles, fallbackPath = '/dashboard' }) {
  const { role, loading } = useAuth()
  const { toast } = useUI()
  const hasShownToast = useRef(false)

  useEffect(() => {
    if (!loading && role) {
      const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
      if (!allowed.includes(role) && !hasShownToast.current) {
        hasShownToast.current = true
        toast('غير مصرح لك بالوصول', { type: 'error' })
      }
    }
  }, [loading, role, allowedRoles, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading…</p>
        </div>
      </div>
    )
  }

  if (!role) {
    return <Navigate to="/login" replace />
  }

  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  if (!allowed.includes(role)) {
    return <Navigate to={fallbackPath} replace />
  }

  return children
}
