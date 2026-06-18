import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { Building2, User, Mail, Lock } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async () => {
    setError('')
    if (!form.full_name || !form.email || !form.password) {
      setError('Please fill all fields')
      return
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data?.user?.identities?.length === 0) {
      setError('This email is already registered. Please login instead.')
      setLoading(false)
      return
    }

    if (data?.user && !data?.session) {
      navigate('/verify-email', { state: { email: form.email } })
      return
    }

    navigate('/login', { state: { registered: true } })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-3 flex justify-center"><Building2 size={40} className="text-blue-600" /></div>
          <h1 className="text-3xl font-bold text-txt-primary">Create Account</h1>
          <p className="text-txt-muted mt-2">Register to manage your bookings</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="bg-surface rounded-2xl shadow-sm border border-border p-8 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-1 flex items-center gap-1.5"><User size={14} /> Full Name *</label>
            <Input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              autoFocus
              placeholder="Ahmed Mohamed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-1 flex items-center gap-1.5"><Mail size={14} /> Email *</label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ahmed@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-1 flex items-center gap-1.5"><Lock size={14} /> Password *</label>
            <Input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-1 flex items-center gap-1.5"><Lock size={14} /> Confirm Password *</label>
            <Input
              name="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              placeholder="Repeat password"
            />
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading}
            size="lg"
            className="w-full mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-txt-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
