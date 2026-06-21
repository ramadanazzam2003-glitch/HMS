import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock, Hash, FileText, CreditCard, User, ArrowRight, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PublicNavbar from '../../components/layout/PublicNavbar'
import { useAuth } from '../../hooks/useAuth'
import BookingCard from '../../components/BookingCard'
import { Skeleton } from '../../components/ui/skeleton'
import { Badge } from '../../components/ui/badge'

export default function PatientDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [bookings, setBookings] = useState([])
  const [records, setRecords] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const phone = session.user.user_metadata?.phone || ''

      const [bookingRes, recordsRes, invoiceRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, doctors(name), departments(name_en)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('medical_records')
          .select('*, doctors(name), departments(name_en), prescriptions(*)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(3),

        phone
          ? supabase
              .from('bills')
              .select('*')
              .eq('patient_phone', phone)
              .order('created_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [] }),
      ])

      if (!ignore) {
        setBookings(bookingRes.data || [])
        setRecords(recordsRes.data || [])
        setInvoices(invoiceRes?.data || [])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const activeBookings = bookings.filter(b => b.status === 'active')
  const totalPaid = invoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + (i.total || 0), 0)
  const totalUnpaid = invoices.filter(i => i.payment_status === 'unpaid').reduce((s, i) => s + (i.total || 0), 0)

  const handleCancel = async (id) => {
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_by: 'patient' })
      .eq('id', id)
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <main className="pt-20 px-4 max-w-4xl mx-auto pb-8">
        <Skeleton className="h-10 w-64 mb-6 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-48 w-full rounded-2xl mb-6" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <main className="pt-20 px-4 max-w-4xl mx-auto pb-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-txt-primary">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p className="text-txt-muted text-sm mt-1">Manage your health journey from one place</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-white border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <CalendarDays size={22} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-txt-primary">{bookings.length}</p>
              <p className="text-xs text-txt-muted">Total Bookings</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <FileText size={22} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-txt-primary">{records.length}</p>
              <p className="text-xs text-txt-muted">Medical Records</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <CreditCard size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-txt-primary">{invoices.length}</p>
              <p className="text-xs text-txt-muted">Invoices</p>
            </div>
          </div>
        </div>

        {activeBookings.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 mb-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Upcoming Appointment</p>
                <p className="text-xl font-bold mb-1">{activeBookings[0].doctors?.name}</p>
                <p className="text-blue-100 text-sm mb-2">{activeBookings[0].departments?.name_en}</p>
                <div className="flex items-center gap-4 text-sm text-blue-100">
                  <span className="flex items-center gap-1"><CalendarDays size={14} /> {activeBookings[0].booking_date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {activeBookings[0].slot_time}</span>
                  <span className="flex items-center gap-1"><Hash size={14} /> {activeBookings[0].booking_ref}</span>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-none capitalize">{activeBookings[0].status}</Badge>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-txt-primary text-sm flex items-center gap-2">
                <CalendarDays size={16} className="text-blue-600" /> Recent Bookings
              </h2>
              <button onClick={() => navigate('/my-bookings')} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                View All <ArrowRight size={14} />
              </button>
            </div>
            {bookings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-txt-muted mb-3">No bookings yet</p>
                <button onClick={() => navigate('/')} className="h-9 px-4 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/20">
                  Book Now
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {bookings.slice(0, 3).map(b => (
                  <BookingCard key={b.id} booking={b} onCancel={handleCancel} onReschedule={(id) => navigate(`/reschedule/${id}`)} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-txt-primary text-sm flex items-center gap-2">
                <FileText size={16} className="text-green-600" /> Medical Records
              </h2>
              <button onClick={() => navigate('/medical-history')} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                View All <ArrowRight size={14} />
              </button>
            </div>
            {records.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-txt-muted">No medical records yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {records.map(record => (
                  <div key={record.id} className="p-3 rounded-xl bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-txt-primary text-sm">{record.doctors?.name}</p>
                        <p className="text-xs text-txt-muted">{record.departments?.name_en}</p>
                      </div>
                      <Badge variant="primary" className="text-xs">{record.created_at?.slice(0, 10)}</Badge>
                    </div>
                    <div className="bg-white rounded-lg p-2.5">
                      <p className="text-xs text-txt-muted mb-0.5">Diagnosis</p>
                      <p className="text-sm text-txt-primary font-medium">{record.diagnosis}</p>
                    </div>
                    {record.prescriptions?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {record.prescriptions.slice(0, 2).map((p, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {p.medication_name} {p.dosage || ''}
                          </span>
                        ))}
                        {record.prescriptions.length > 2 && (
                          <span className="text-xs text-txt-muted">+{record.prescriptions.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-txt-primary text-sm flex items-center gap-2">
              <CreditCard size={16} className="text-amber-600" /> Payment Summary
            </h2>
            <button onClick={() => navigate('/payments')} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="text-xs text-green-600 mb-1">Total Paid</p>
              <p className="font-display text-xl font-extrabold text-green-600">EGP {totalPaid.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-xs text-red-500 mb-1">Total Unpaid</p>
              <p className="font-display text-xl font-extrabold text-red-500">EGP {totalUnpaid.toFixed(2)}</p>
            </div>
          </div>
          {invoices.length > 0 && (
            <div className="flex flex-col gap-2">
              {invoices.slice(0, 3).map(inv => (
                <div key={inv.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-txt-primary">#{inv.invoice_number}</p>
                    <p className="text-xs text-txt-muted">{inv.created_at?.slice(0, 10)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-txt-primary">EGP {inv.total?.toFixed(2) || '0.00'}</p>
                    <Badge className="mt-0.5" variant={inv.payment_status === 'paid' ? 'success' : inv.payment_status === 'partial' ? 'warning' : 'danger'}>
                      {inv.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Profile', icon: User, path: '/profile', color: 'text-blue-600 bg-blue-50' },
            { label: 'Bookings', icon: CalendarDays, path: '/my-bookings', color: 'text-purple-600 bg-purple-50' },
            { label: 'Records', icon: FileText, path: '/medical-history', color: 'text-green-600 bg-green-50' },
            { label: 'Payments', icon: CreditCard, path: '/payments', color: 'text-amber-600 bg-amber-50' },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-border hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                <item.icon size={20} />
              </div>
              <span className="text-xs font-semibold text-txt-primary">{item.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
