import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import BookingCard from '../../components/BookingCard'
import { useUI } from '../../hooks/useUI'

export default function MyBookings() {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const { confirm } = useUI()
  const [user, setUser]         = useState(null)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return navigate('/login')

      if (!ignore) setUser(session.user)

      const { data } = await supabase
        .from('bookings')
        .select('*, doctors(name), departments(name_en)')
        .eq('phone', session.user.user_metadata?.phone || '')
        .order('created_at', { ascending: false })

      if (!ignore) {
        setBookings(data || [])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleCancel = async (id) => {
    if (!await confirm('Cancel this booking?')) return
    const booking = bookings.find(b => b.id === id)
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_by: 'patient' })
      .eq('id', id)
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))

    if (booking) {
      const { sendEmail, logNotification, bookingCancellationEmail } = await import('../../lib/resend')
      const emailHtml = bookingCancellationEmail({
        patientName: booking.patient_name,
        doctorName: booking.doctors?.name,
        date: booking.booking_date,
        time: booking.slot_time,
        bookingRef: booking.booking_ref,
      })
      sendEmail({
        to: booking.phone,
        subject: 'Booking Cancelled - MediBook',
        html: emailHtml,
      }).then(result => {
        logNotification({ bookingId: id, recipientEmail: booking.phone, type: 'booking_cancellation', status: result.success ? 'sent' : 'failed', errorMessage: result.error })
      })
    }
  }

  return (
    <div className="page">

      <Navbar
        back="/"
        subtitle="Hospital System"
        right={
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm">+ New Booking</button>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">Logout</button>
          </div>
        }
      />

      <div className="hero-gradient">
        <div className="hero-inner text-center">
          <span className="hero-chip">My Appointments</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">My Bookings</h1>
          {user?.user_metadata?.full_name && (
            <p className="text-white/65 text-sm">{user.user_metadata.full_name}</p>
          )}
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="spinner spinner-lg mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Loading…</p>
            </div>
          </div>

        ) : bookings.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-title">No Bookings Yet</p>
            <p className="empty-state-desc">You have no appointments booked.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary btn-md">Book Now</button>
          </div>

        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map(b => (
              <BookingCard key={b.id} booking={b} onCancel={handleCancel} onReschedule={(id) => navigate(`/reschedule/${id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
