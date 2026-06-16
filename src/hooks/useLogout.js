import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function useLogout(redirectTo = '/login') {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const logout = async () => {
    await signOut()
    navigate(redirectTo)
  }

  return logout
}
