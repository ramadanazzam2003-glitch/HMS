import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, User, Stethoscope, CalendarDays, Clock, AlertTriangle, CreditCard } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import PublicNavbar from '../../components/layout/PublicNavbar'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useUI } from '../../hooks/useUI'

export default function Confirmation() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { toast } = useUI()
  const { t, isRTL } = useLanguage()
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
    <div className="page pt-[72px]">
      <PublicNavbar back="/" />

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
          <h1 className="text-2xl font-bold text-txt-primary mb-2">{t.bookingConfirmed}</h1>
          <p className="text-txt-muted">{t.appointmentBooked}</p>
        </motion.div>

        {/* Queue Number */}
        <motion.div
          className="animate-fadeIn mb-4"
          style={{ animationDelay: '100ms' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-7 text-center bg-gradient-to-br from-blue-800 to-blue-600 border-none">
            <p className="text-xs text-white/70 font-semibold tracking-widest uppercase mb-2">{t.yourQueueNumber}</p>
            <div className="text-7xl font-black text-white leading-none mb-2 drop-shadow-lg">
              #{state?.queueNumber}
            </div>
            <p className="text-sm text-white/70">{t.waitForCall}</p>
          </Card>
        </motion.div>

        {/* Booking Details */}
        <motion.div
          className="animate-fadeIn mb-4"
          style={{ animationDelay: '150ms' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-txt-primary text-sm">{t.bookingDetails}</h2>
              <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                {state?.bookingRef}
              </span>
            </div>

            <div className="flex flex-col">
              {[
                { icon: <User size={14} />, labelKey: 'patientLabel', value: state?.patientName },
                { icon: <Stethoscope size={14} />, labelKey: 'doctor', value: state?.doctorName },
                { icon: <CalendarDays size={14} />, labelKey: 'dateLabel', value: state?.date },
                { icon: <Clock size={14} />, labelKey: 'timeLabel', value: state?.slotTime ? `${state.slotTime} → ${state.endTime}` : state?.slotTime },
                { icon: <Clock size={14} />, labelKey: 'durationLabel', value: `15 ${t.minutesLabel}` },
              ].map(({ icon, labelKey, value }, i) => (
                <div key={labelKey} className={`flex justify-between items-center py-3 ${i < 4 ? 'border-b border-border' : ''}`}>
                  <span className="text-sm text-txt-muted flex items-center gap-1.5">{icon} {t[labelKey]}</span>
                  <span className="text-sm font-semibold text-txt-primary">{value || '—'}</span>
                </div>
              ))}
            </div>
          </Card>
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
            <p className="font-semibold mb-0.5">{t.saveBookingRefTitle}</p>
            <p className="text-xs">
              {isRTL
                ? <>ستحتاج إلى <strong>{state?.bookingRef}</strong> لإلغاء أو تعديل حجزك.</>
                : <>You'll need <strong>{state?.bookingRef}</strong> to cancel or modify your booking.</>}
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 mt-2">
          <Button
            onClick={handlePayNow} disabled={paying} size="lg" className="w-full"
          >
            {paying ? t.processingLabel : <span className="flex items-center justify-center gap-2"><CreditCard size={16} /> {t.payNow}</span>}
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate('/my-bookings')}>
            {t.viewMyBookings}
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/')}>
            {t.backToHome}
          </Button>
          <Button variant="ghost" className="w-full text-txt-muted text-sm py-2" onClick={() => navigate('/cancel')}>
            {t.cancelThisBooking}
          </Button>
        </div>
      </div>
    </div>
  )
}
