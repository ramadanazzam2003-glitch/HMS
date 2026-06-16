import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertTriangle, CheckCircle, User, Stethoscope, Building2, CalendarDays, Clock, Hash, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function Cancel() {
  const navigate = useNavigate()
  const [bookingRef, setBookingRef] = useState('')
  const [phone, setPhone] = useState('')
  const [booking, setBooking] = useState(null)
  const [step, setStep] = useState('search')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentStep = step === 'search' ? 0 : step === 'confirm' ? 1 : 2

  const handleSearch = async () => {
    if (!bookingRef || !phone) {
      setError('Please enter both booking reference and phone number')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('bookings')
      .select('*, doctors(name), departments(name_en)')
      .eq('booking_ref', bookingRef.toUpperCase())
      .eq('phone', phone)
      .single()

    setLoading(false)

    if (err || !data) {
      setError('Booking not found. Please check your reference and phone number.')
      return
    }

    if (data.status === 'cancelled') {
      setError('This booking has already been cancelled.')
      return
    }

    setBooking(data)
    setStep('confirm')
  }

  const handleCancel = async () => {
    setLoading(true)
    const { error: err } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_by: 'patient' })
      .eq('id', booking.id)

    setLoading(false)
    if (err) { setError('Error cancelling booking. Please try again.'); return }
    setStep('done')
  }

  return (
    <div className="page">

      <Navbar
        back="/"
        subtitle="Cancel Booking"
        right={
          <div className="flex items-center gap-1.5 text-xs">
            {['Search', 'Confirm', 'Done'].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={i === currentStep ? 'font-bold text-red-500' : i < currentStep ? 'text-green-500' : 'text-gray-400'}>
                  {i < currentStep ? '✓ ' : ''}{s}
                </span>
                {i < 2 && <span className="text-gray-400">›</span>}
              </div>
            ))}
          </div>
        }
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-red-800 via-red-600 to-red-400 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5" />
        <div className="max-w-6xl mx-auto px-4 py-10 text-center relative">
          <span className="inline-block bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold tracking-widest uppercase px-3.5 py-1 rounded-full mb-2.5 border border-white/20">
            Cancel Booking
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">Find Your Booking</h1>
          <p className="text-white/70 text-base">Enter your booking reference and phone number to cancel</p>
        </div>
      </div>

      <div className="page-content max-w-md">

        <AnimatePresence mode="wait">
          {/* STEP 1: Search */}
          {step === 'search' && (
            <motion.div
              key="search"
              className="card animate-fadeIn p-7"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-bold text-gray-900 text-base mb-5 flex items-center gap-2"><Search size={18} /> Search Booking</h2>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="input-label">Booking Reference *</label>
                  <input
                    value={bookingRef}
                    onChange={e => setBookingRef(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && document.getElementById('phone-input').focus()}
                    className="input uppercase tracking-wide"
                    placeholder="BK-123456"
                  />
                </div>

                <div>
                  <label className="input-label">Phone Number *</label>
                  <input
                    id="phone-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="input"
                    placeholder="01012345678"
                  />
                </div>

                {error && (
                  <div className="alert-error animate-fadeIn">
                    <X size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button onClick={handleSearch} disabled={loading} className="btn-danger btn-full mt-1">
                  {loading ? 'Searching...' : 'Find My Booking'}
                </button>

                <button onClick={() => navigate('/')} className="btn btn-ghost btn-full">
                  ← Back to Home
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Confirm Cancel */}
          {step === 'confirm' && booking && (
            <motion.div
              key="confirm"
              className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-gray-900 text-sm">Booking Found</h2>
                  <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    {booking.booking_ref}
                  </span>
                </div>

                <div className="flex flex-col">
                  {[
                    { icon: <User size={14} />, label: 'Patient', value: booking.patient_name },
                    { icon: <Stethoscope size={14} />, label: 'Doctor', value: booking.doctors?.name },
                    { icon: <Building2 size={14} />, label: 'Department', value: booking.departments?.name_en },
                    { icon: <CalendarDays size={14} />, label: 'Date', value: booking.booking_date },
                    { icon: <Clock size={14} />, label: 'Time', value: booking.slot_time },
                    { icon: <Hash size={14} />, label: 'Queue', value: `#${booking.queue_number}` },
                  ].map(({ icon, label, value }, i) => (
                    <div key={label} className={`flex justify-between items-center py-2.5 ${i < 5 ? 'border-b border-gray-100' : ''}`}>
                      <span className="text-sm text-gray-400 flex items-center gap-1.5">{icon} {label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="alert-error animate-fadeIn" style={{ animationDelay: '60ms' }}>
                <AlertTriangle size={20} />
                <div>
                  <p className="font-semibold mb-0.5">Are you sure?</p>
                  <p className="text-xs">This action cannot be undone. Your booking will be permanently cancelled.</p>
                </div>
              </div>

              {error && (
                <div className="alert-error animate-fadeIn">
                  <X size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button onClick={handleCancel} disabled={loading} className="btn-danger btn-full btn-lg">
                {loading ? 'Cancelling...' : 'Yes, Cancel My Booking'}
              </button>

              <button onClick={() => { setStep('search'); setBooking(null) }} className="btn-secondary btn-full">
                ← No, Keep My Booking
              </button>
            </motion.div>
          )}

          {/* STEP 3: Done */}
          {step === 'done' && (
            <motion.div
              key="done"
              className="card p-10 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-18 h-18 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={36} className="text-green-500" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">Booking Cancelled</h2>
              <p className="text-gray-500 text-sm mb-1">
                Your booking <strong className="text-red-500">{booking?.booking_ref}</strong> has been successfully cancelled.
              </p>
              <p className="text-gray-400 text-sm mb-7">
                You can make a new booking anytime from the home page.
              </p>

              <div className="flex flex-col gap-2.5">
                <button onClick={() => navigate('/')} className="btn-primary btn-full btn-lg">Back to Home</button>
                <button onClick={() => navigate('/my-bookings')} className="btn-secondary btn-full">View My Bookings</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
