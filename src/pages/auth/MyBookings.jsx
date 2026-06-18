import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PublicNavbar from '../../components/layout/PublicNavbar'
import BookingCard from '../../components/BookingCard'
import { useUI } from '../../hooks/useUI'
import { Skeleton } from '../../components/ui/skeleton'

export default function MyBookings() {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const { confirm } = useUI()
  const [user, setUser]         = useState(null)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
        if (!session) return

        if (!ignore) setUser(session.user)

        const { data } = await supabase
          .from('bookings')
          .select('*, doctors(name), departments(name_en)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (!ignore) {
          setBookings(data || [])
          setLoading(false)
        }
      } catch (err) {
        console.error('MyBookings load error:', err)
        if (!ignore) setLoading(false)
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
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_by: 'patient' })
      .eq('id', id)
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />

      <main className="pt-20 px-4 max-w-3xl mx-auto pb-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-txt-primary mb-2">My Bookings</h1>
          {user?.user_metadata?.full_name && (
            <p className="text-txt-muted text-sm">{user.user_metadata.full_name}</p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>

        ) : bookings.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-10 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-lg font-bold text-txt-primary mb-1">No Bookings Yet</p>
            <p className="text-sm text-txt-muted mb-4">You have no appointments booked.</p>
            <button onClick={() => navigate('/')} className="h-10 px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-lg shadow-primary/20">Book Now</button>
          </div>

        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map(b => (
              <BookingCard key={b.id} booking={b} onCancel={handleCancel} onReschedule={(id) => navigate(`/reschedule/${id}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
