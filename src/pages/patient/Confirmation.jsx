import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, User, Stethoscope, CalendarDays, Clock, AlertTriangle, CreditCard } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { useUI } from '../../hooks/useUI'

export default function Confirmation() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { toast } = useUI()
  const [paying, setPaying] = useState(false)

  const handlePayNow = async () => {
    setPaying(true)
    try {
      const { createPaymobOrder, createPaymobPaymentKey, getPaymobCheckoutUrl } = await import('../../lib/paymob')
      const { orderId } = await createPaymobOrder({
        amount: 200,
        items: [{ name: 'Consultation', amount: 200, quantity: 1 }],
      })

      const paymentKey = await createPaymobPaymentKey({
        orderId,
        billingData: {
          amount: 200,
          firstName: state?.patientName?.split(' ')[0] || 'Patient',
          phone: 'N/A',
          email: 'patient@medibook.com',
        },
      })

      const checkoutUrl = getPaymobCheckoutUrl(paymentKey)
      window.open(checkoutUrl, '_blank')
    } catch (err) {
      toast('Payment error: ' + err.message, { type: 'error' })
    }
    setPaying(false)
  }

  return (
    <div className="page">

      <Navbar
        subtitle="Booking Confirmed"
        right={
          <button onClick={() => window.print()} className="btn btn-outline btn-sm">
            Print
          </button>
        }
      />

      <div className="page-content">

        {/* Success Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500">Your appointment has been successfully booked</p>
        </motion.div>

        {/* Queue Number */}
        <motion.div
          className="card animate-fadeIn p-7 text-center mb-4 bg-gradient-to-br from-blue-800 to-blue-600 border-none"
          style={{ animationDelay: '100ms' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <p className="text-xs text-white/70 font-semibold tracking-widest uppercase mb-2">Your Queue Number</p>
          <div className="text-7xl font-black text-white leading-none mb-2 drop-shadow-lg">
            #{state?.queueNumber}
          </div>
          <p className="text-sm text-white/70">Please wait for your number to be called</p>
        </motion.div>

        {/* Booking Details */}
        <motion.div
          className="card animate-fadeIn p-6 mb-4"
          style={{ animationDelay: '150ms' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900 text-sm">Booking Details</h2>
            <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              {state?.bookingRef}
            </span>
          </div>

          <div className="flex flex-col">
            {[
              { icon: <User size={14} />, label: 'Patient', value: state?.patientName },
              { icon: <Stethoscope size={14} />, label: 'Doctor', value: state?.doctorName },
              { icon: <CalendarDays size={14} />, label: 'Date', value: state?.date },
              { icon: <Clock size={14} />, label: 'Time', value: state?.slotTime ? `${state.slotTime} → ${state.endTime}` : state?.slotTime },
              { icon: <Clock size={14} />, label: 'Duration', value: '15 minutes' },
            ].map(({ icon, label, value }, i) => (
              <div key={label} className={`flex justify-between items-center py-3 ${i < 4 ? 'border-b border-gray-100' : ''}`}>
                <span className="text-sm text-gray-400 flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-sm font-semibold text-gray-900">{value || '—'}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Save Reference Notice */}
        <motion.div
          className="alert-warning animate-fadeIn mb-4"
          style={{ animationDelay: '200ms' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AlertTriangle size={20} />
          <div>
            <p className="font-semibold mb-0.5">Save your booking reference</p>
            <p className="text-xs">
              You'll need <strong>{state?.bookingRef}</strong> to cancel or modify your booking.
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 mt-2">
          <motion.button
            onClick={handlePayNow} disabled={paying}
            className="btn-primary btn-full btn-lg"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {paying ? 'Processing...' : <span className="flex items-center justify-center gap-2"><CreditCard size={16} /> Pay Now (EGP 200)</span>}
          </motion.button>
          <button onClick={() => navigate('/my-bookings')} className="btn-secondary btn-full btn-lg">
            View My Bookings
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary btn-full btn-lg">
            Back to Home
          </button>
          <button onClick={() => navigate('/cancel')} className="btn btn-ghost btn-full text-gray-400 text-sm py-2">
            Cancel this booking
          </button>
        </div>
      </div>
    </div>
  )
}
