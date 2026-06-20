import { createContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export { AuthContext }

const ROLE_CACHE_KEY = 'medibook-role'
const ROLE_LEVEL_CACHE_KEY = 'medibook-role-level'
const PERMS_CACHE_KEY = 'medibook-permissions'
const USER_CACHE_KEY = 'medibook-user'
const PROFILE_CACHE_KEY = 'medibook-profile'

function withTimeout(promise, ms = 15000) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Query timed out after ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

function getCachedAuth() {
  try {
    const role = localStorage.getItem(ROLE_CACHE_KEY)
    const level = localStorage.getItem(ROLE_LEVEL_CACHE_KEY)
    const perms = localStorage.getItem(PERMS_CACHE_KEY)
    const user = localStorage.getItem(USER_CACHE_KEY)
    const profile = localStorage.getItem(PROFILE_CACHE_KEY)
    return {
      role: role || null,
      roleLevel: level ? parseInt(level, 10) : 0,
      permissions: perms ? JSON.parse(perms) : [],
      user: user ? JSON.parse(user) : null,
      profile: profile ? JSON.parse(profile) : null,
    }
  } catch { return { role: null, roleLevel: 0, permissions: [], user: null, profile: null } }
}

function setCachedAuth(role, roleLevel, permissions, user, profile) {
  try {
    if (role) localStorage.setItem(ROLE_CACHE_KEY, role)
    localStorage.setItem(ROLE_LEVEL_CACHE_KEY, String(roleLevel))
    localStorage.setItem(PERMS_CACHE_KEY, JSON.stringify(permissions))
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
    if (profile) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
  } catch { /* storage full */ }
}

function clearCachedAuth() {
  try {
    localStorage.removeItem(ROLE_CACHE_KEY)
    localStorage.removeItem(ROLE_LEVEL_CACHE_KEY)
    localStorage.removeItem(PERMS_CACHE_KEY)
    localStorage.removeItem(USER_CACHE_KEY)
    localStorage.removeItem(PROFILE_CACHE_KEY)
  } catch { /* storage blocked */ }
}

export function AuthProvider({ children }) {
  const cached = getCachedAuth()

  const [user, setUser] = useState(cached.user)
  const [profile, setProfile] = useState(cached.profile)
  const [role, setRole] = useState(cached.role)
  const [roleLevel, setRoleLevel] = useState(cached.roleLevel)
  const [permissions, setPermissions] = useState(cached.permissions)
 const [loading, setLoading] = useState(!cached.user)

  const fetchingRef = useRef(false)
  const initDoneRef = useRef(!!cached.role)

  const resetAuthState = useCallback(() => {
    setProfile(null)
    setRole(null)
    setRoleLevel(0)
    setPermissions([])
    setUser(null)
    clearCachedAuth()
  }, [])

  const fetchProfile = useCallback(async (userId) => {
    if (!userId || fetchingRef.current) return

    fetchingRef.current = true

    try {
      const { data: profileData, error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        12000
      )

      if (profileError) throw profileError

      if (!profileData) {
        const newRole = 'patient'
        setRole(newRole)
        setRoleLevel(0)
        setPermissions([])
        setCachedAuth(newRole, 0, [], user, null)
        return
      }

      setProfile(profileData)

      const [roleResult, permResult] = await Promise.allSettled([
        withTimeout(
          supabase
            .from('roles')
            .select('*')
            .eq('id', profileData.role_id)
            .maybeSingle(),
          10000
        ),

        withTimeout(
          supabase
            .from('role_permissions')
            .select('permissions(name)')
            .eq('role_id', profileData.role_id),
          10000
        )
      ])

      const roleData = roleResult.status === 'fulfilled' ? roleResult.value?.data : null
      const permData = permResult.status === 'fulfilled' ? permResult.value?.data : null

      const newRole = roleData?.name || 'patient'
      const newLevel = roleData?.level || 0
      const permNames =
        permData
          ?.map(rp => rp.permissions?.name)
          .filter(Boolean) || []

      setRole(newRole)
      setRoleLevel(newLevel)
      setPermissions(permNames)
      setCachedAuth(newRole, newLevel, permNames, user, profileData)

    } catch (err) {
      console.error('fetchProfile error:', err)

      const cachedAuth = getCachedAuth()
      if (!cachedAuth.role) {
        setRole('patient')
        setRoleLevel(0)
        setPermissions([])
      }
    } finally {
      fetchingRef.current = false
    }
  }, [user])

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const {
          data: { session },
          error
        } = await withTimeout(supabase.auth.getSession(), 15000)

        if (!mounted) return

        if (error) {
          console.error('Session error:', error)
          if (!initDoneRef.current) setLoading(false)
          initDoneRef.current = true
          return
        }

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          clearCachedAuth()
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
          initDoneRef.current = true
        }
      }
    }

    init()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'INITIAL_SESSION') return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
          if (mounted) setLoading(false)
        } else {
          setUser(null)
          resetAuthState()
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, resetAuthState])

  function hasPermission(permission) {
    return permissions.includes('*') || permissions.includes(permission)
  }

  function hasAnyPermission(perms) {
    return permissions.includes('*') ||
      perms.some(p => permissions.includes(p))
  }

  function hasAllPermissions(perms) {
    return permissions.includes('*') ||
      perms.every(p => permissions.includes(p))
  }

  function hasRole(allowedRoles) {
    if (!role) return false

    return Array.isArray(allowedRoles)
      ? allowedRoles.includes(role)
      : role === allowedRoles
  }

  function hasMinRoleLevel(minLevel) {
    return roleLevel >= minLevel
  }

  async function signOut() {
    await supabase.auth.signOut()

    setUser(null)
    resetAuthState()
  }

  const staffRoles = [
    'manager',
    'admin',
    'director',
    'dept_manager',
    'doctor',
    'nurse',
    'receptionist'
  ]

  const adminRoles = [
    'manager',
    'admin',
    'director'
  ]

  const value = {
    user,
    profile,
    role,
    roleLevel,
    permissions,
    loading,

    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasMinRoleLevel,

    signOut,
    logout: signOut,

    isPatient: role === 'patient',
    isStaff: staffRoles.includes(role),
    isAdmin: adminRoles.includes(role),
    isDoctor: role === 'doctor',
    isManager: role === 'manager',

    refreshProfile: () => {
      if (user?.id) {
        fetchProfile(user.id)
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
