import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function VerifyEmail() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(60)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef([])

  // Countdown timer للـ resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  // Auto-focus أول input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index, value) => {
    // قبول رقم واحد بس
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setError('')

    // انتقل للـ input الجاي
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // لو اتملأوا كلهم - verify تلقائي
    if (digit && index === 5) {
      const fullCode = [...newDigits.slice(0, 5), digit].join('')
      if (fullCode.length === 6) handleVerify(fullCode)
    }
  }

  const handleKeyDown = (index, e) => {
    // Backspace - ارجع للـ input اللي قبل
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newDigits = [...digits]
    pasted.split('').forEach((d, i) => { newDigits[i] = d })
    setDigits(newDigits)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    if (pasted.length === 6) handleVerify(pasted)
  }

  const handleVerify = async (codeOverride) => {
    const code = codeOverride || digits.join('')
    if (code.length !== 6) { setError('Please enter the complete 6-digit code'); return }
    if (!state?.email) { setError('Email not found. Please register again.'); return }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email: state.email,
      token: code,
      type: 'signup'
    })

    if (error) {
      setError('Invalid or expired code. Please try again.')
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      setLoading(false)
      return
    }

    navigate('/login', { state: { verified: true } })
  }

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return
    setResending(true)
    setError('')

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: state?.email
    })

    if (error) {
      setError('Failed to resend. Please try again.')
    } else {
      setResendTimer(60)
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
    setResending(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

          {/* Icon */}
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">📧</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">Check your email</h1>
          <p className="text-gray-500 text-sm mb-1">We sent a 6-digit code to</p>
          <p className="text-blue-600 font-semibold mb-8">{state?.email}</p>

          {/* OTP Inputs */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
                  ${digit
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-800'
                  }
                  focus:border-blue-500 focus:bg-blue-50`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              ❌ {error}
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={loading || digits.join('').length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-40 mb-4"
          >
            {loading ? 'Verifying...' : 'Verify Code →'}
          </button>

          {/* Resend */}
          <p className="text-sm text-gray-500">
            Didn't receive it?{' '}
            {resendTimer > 0 ? (
              <span className="text-gray-400">Resend in {resendTimer}s</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            )}
          </p>
        </div>

        {/* Back to login */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Wrong email?{' '}
          <button onClick={() => navigate('/register')} className="text-blue-600 hover:underline font-medium">
            Go back
          </button>
        </p>
      </div>
    </div>
  )
}