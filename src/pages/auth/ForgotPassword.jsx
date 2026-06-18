import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    setError('')
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-3xl font-bold text-txt-primary">Forgot Password</h1>
          <p className="text-txt-muted mt-2">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 space-y-4">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-lg font-bold text-txt-primary mb-2">Check Your Email</h2>
              <p className="text-sm text-txt-muted mb-4">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-xs text-txt-muted mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button
                onClick={() => { setSent(false); setEmail('') }}
                variant="outline"
              >
                Try Another Email
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-txt-secondary mb-1">Email *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                  autoFocus
                  placeholder="ahmed@example.com"
                />
              </div>

              <Button
                onClick={handleReset}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </>
          )}

          <p className="text-center text-sm text-txt-muted">
            Remember your password?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
