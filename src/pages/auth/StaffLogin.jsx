import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { motion } from 'framer-motion'
import { Building2, Mail, Lock } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

function withTimeout(promise, ms = 10000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Connection timed out. Please check your network and try again.')), ms)
  )
  return Promise.race([promise, timeout])
}

const REDIRECT_MAP = {
  admin:        '/dashboard',
  director:     '/director',
  dept_manager: '/dept-manager',
  doctor:       '/doctor',
  nurse:        '/nurse/triage',
  receptionist: '/receptionist',
  patient:      '/',
}


export default function StaffLogin() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user, role, loading: authLoading } = useAuth()
  const { toast } = useUI()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (user && role) {
    const target = REDIRECT_MAP[role] || '/'
    return <Navigate to={target} replace />
  }

  const handleLogin = async (e) => {
    e?.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Please fill all fields')
      return
    }

    setLoading(true)

    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
      )

      const { data, error: authError } = result

      if (authError) {
        if (authError.message.includes('Email not confirmed') || authError.message.includes('email_not_confirmed')) {
          setError('Please verify your email first. Check your inbox for the verification code.')
        } else {
          setError('Invalid email or password')
        }
        setLoading(false)
        return
      }

      if (!data.session) {
        setError('Login failed. Please try again.')
        setLoading(false)
        return
      }

      let roleName = null

      try {
        const { data: profile, error: profileError } = await withTimeout(
          supabase
            .from('profiles')
            .select('role_id')
            .eq('user_id', data.user.id)
            .maybeSingle()
        )

        if (!profileError && profile?.role_id) {
          const { data: roleData } = await withTimeout(
            supabase
              .from('roles')
              .select('name')
              .eq('id', profile.role_id)
              .maybeSingle()
          )

          if (roleData) {
            roleName = roleData.name
          }
        }
      } catch {
        console.warn('Profile query timed out, checking user metadata')
      }

      if (!roleName) {
        roleName = data.user.user_metadata?.role || 'patient'
      }

      const redirect = REDIRECT_MAP[roleName] || '/'
      toast(`Welcome back! Redirecting...`, { type: 'success' })
      navigate(redirect, { replace: true })

    } catch (err) {
      setError(err.message || 'Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-3 flex justify-center"><Building2 size={40} className="text-blue-600" /></div>
          <h1 className="text-3xl font-bold text-txt-primary">Welcome Back</h1>
          <p className="text-txt-muted mt-2">Sign in to your MediBook account</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="bg-surface rounded-2xl shadow-sm border border-border p-8 space-y-4">

          {state?.verified && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
              Email verified! You can now login.
            </div>
          )}

          {state?.registered && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
              Account created! Please check your email to verify, then login.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-txt-secondary mb-1 flex items-center gap-1.5"><Mail size={14} /> Email *</label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoFocus
                placeholder="ahmed@example.com"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-txt-secondary mb-1 flex items-center gap-1.5"><Lock size={14} /> Password *</label>
              <Input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full mt-6"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-primary font-semibold hover:underline">
              Forgot Password?
            </Link>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-center text-sm text-txt-muted">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Register
              </Link>
            </p>

            <p className="text-center text-sm text-txt-muted mt-2">
              Didn't receive verification email?{' '}
              <Link to="/verify-email" className="text-primary font-semibold hover:underline">
                Verify here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
