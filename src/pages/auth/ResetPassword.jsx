import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const validToken = typeof window !== 'undefined' && window.location.hash.length > 1

  const handleReset = async () => {
    setError('')

    if (!password) {
      setError('Please enter a new password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">⚠️</div>
            <h1 className="text-3xl font-bold text-txt-primary">Invalid Link</h1>
            <p className="text-txt-muted mt-2">This password reset link is invalid or has expired.</p>
          </div>
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 text-center">
            <Link to="/forgot-password">
              <Button>Request New Link</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-3xl font-bold text-txt-primary">Reset Password</h1>
          <p className="text-txt-muted mt-2">Enter your new password below</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 space-y-4">
          {success ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-lg font-bold text-txt-primary mb-2">Password Updated!</h2>
              <p className="text-sm text-txt-muted mb-4">
                Your password has been successfully reset. Redirecting to login...
              </p>
              <Link to="/login">
                <Button>Go to Login</Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-txt-secondary mb-1">New Password *</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-txt-secondary mb-1">Confirm Password *</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                  placeholder="Confirm your password"
                />
              </div>

              <Button
                onClick={handleReset}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </Button>
            </>
          )}

          <p className="text-center text-sm text-txt-muted">
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
