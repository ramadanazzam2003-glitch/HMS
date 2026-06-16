import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'

export default function Bookings() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const { confirm } = useUI()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, doctors(name), departments(name_en)')
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, doctors(name), departments(name_en)')
        .order('created_at', { ascending: false })
      if (!ignore) { setBookings(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const handleCancel = async (id) => {
    if (!await confirm('Cancel this booking?')) return
    const booking = bookings.find(b => b.id === id)
    await supabase.from('bookings').update({ status: 'cancelled', cancelled_by: user?.id }).eq('id', id)
    fetchBookings()

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

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter
    const matchSearch = !search ||
      b.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search)
    return matchStatus && matchSearch
  })

  return (
    <div className="page">
      <Navbar
        variant="dashboard" back="/dashboard" subtitle="All Bookings"
      />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Search size={16} /></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input pl-9" placeholder="Search by name, ref, or phone..." />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'cancelled'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`btn btn-md capitalize ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="spinner spinner-lg mx-auto mb-4" />
                <p className="text-gray-400 font-medium">Loading…</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><CalendarDays size={48} className="text-gray-300" /></div>
              <p className="empty-state-title">No Bookings Found</p>
              <p className="empty-state-desc">{search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'No bookings have been made yet.'}</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Ref', 'Patient', 'Phone', 'Doctor', 'Department', 'Queue', 'Status', 'Action'].map(col => (
                        <th key={col} className="px-4 py-3 text-left font-semibold text-gray-400 text-[11px] whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b, i) => (
                      <motion.tr key={b.id}
                        className="border-b border-gray-100"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.8)' }}>
                        <td className="px-4 py-3 font-mono text-blue-600 font-semibold">{b.booking_ref}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{b.patient_name}</td>
                        <td className="px-4 py-3 text-gray-400">{b.phone}</td>
                        <td className="px-4 py-3 text-gray-500">{b.doctors?.name}</td>
                        <td className="px-4 py-3 text-gray-400">{b.departments?.name_en}</td>
                        <td className="px-4 py-3"><span className="badge badge-primary">#{b.queue_number}</span></td>
                        <td className="px-4 py-3">
                          <span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{b.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {b.status === 'active' && hasPermission('bookings:update') && (
                            <div className="flex gap-1">
                              <button onClick={() => navigate(`/reschedule/${b.id}`)} className="btn btn-ghost btn-sm text-blue-500 text-xs">Reschedule</button>
                              <button onClick={() => handleCancel(b.id)} className="btn btn-ghost btn-sm text-red-500 text-xs">Cancel</button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
                Showing {filtered.length} of {bookings.length} bookings
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
