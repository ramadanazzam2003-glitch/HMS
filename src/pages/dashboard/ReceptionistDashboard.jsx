import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useLogout } from '../../hooks/useLogout'

export default function ReceptionistDashboard() {
  const navigate = useNavigate()
  const handleLogout = useLogout('/login')

  const [stats, setStats] = useState({ today: 0, waiting: 0, completed: 0 })
  const [todayBookings, setTodayBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('bookings')
        .select('*, doctors(name), departments(name_en)')
        .eq('booking_date', today)
        .order('slot_time')

      if (!ignore) {
        const all = data || []
        setTodayBookings(all)
        setStats({
          today: all.length,
          waiting: all.filter(b => b.status === 'active').length,
          completed: all.filter(b => b.status === 'completed').length,
        })
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" subtitle="Receptionist" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard"
        subtitle="Reception Desk"
        right={
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/receptionist/walk-in')} className="btn btn-primary btn-sm">+ Walk-In</button>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">Logout</button>
          </div>
        }
      />

      <div className="page-content-lg">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-5">
            <p className="text-xs text-gray-400 mb-1">Today's Appointments</p>
            <p className="font-display text-3xl font-extrabold text-gray-800">{stats.today}</p>
          </div>
          <div className="card p-5 bg-yellow-50 border-yellow-200">
            <p className="text-xs text-yellow-600 mb-1">Waiting</p>
            <p className="font-display text-3xl font-extrabold text-yellow-600">{stats.waiting}</p>
          </div>
          <div className="card p-5 bg-green-50 border-green-200">
            <p className="text-xs text-green-600 mb-1">Completed</p>
            <p className="font-display text-3xl font-extrabold text-green-600">{stats.completed}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <button onClick={() => navigate('/receptionist/walk-in')}
            className="card p-5 text-center hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-blue-200">
            <div className="text-3xl mb-2">🚶</div>
            <p className="font-semibold text-gray-900 text-sm">Walk-In Booking</p>
            <p className="text-xs text-gray-400 mt-0.5">Book for a patient</p>
          </button>
          <button onClick={() => navigate('/receptionist/patients')}
            className="card p-5 text-center hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-blue-200">
            <div className="text-3xl mb-2">👥</div>
            <p className="font-semibold text-gray-900 text-sm">Patient Directory</p>
            <p className="text-xs text-gray-400 mt-0.5">Search patients</p>
          </button>
          <button onClick={() => navigate('/receptionist/check-in-out')}
            className="card p-5 text-center hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-blue-200">
            <div className="text-3xl mb-2">🏥</div>
            <p className="font-semibold text-gray-900 text-sm">Check-In / Out</p>
            <p className="text-xs text-gray-400 mt-0.5">Manage arrivals</p>
          </button>
          <button onClick={() => navigate('/dashboard/bookings')}
            className="card p-5 text-center hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-blue-200">
            <div className="text-3xl mb-2">📋</div>
            <p className="font-semibold text-gray-900 text-sm">All Bookings</p>
            <p className="text-xs text-gray-400 mt-0.5">View all appointments</p>
          </button>
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-base font-bold text-gray-900">Today's Queue ({todayBookings.length})</h2>
            <button onClick={() => navigate('/receptionist/check-in-out')} className="text-xs text-blue-600 font-semibold">Manage →</button>
          </div>
          {todayBookings.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No appointments today</p>
          ) : (
            <div className="flex flex-col gap-2">
              {todayBookings.slice(0, 8).map((b, i) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl animate-fadeIn"
                  style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold text-blue-600">{b.slot_time}</p>
                    </div>
                    <div className="border-l border-gray-200 pl-3">
                      <p className="font-semibold text-gray-900 text-sm">{b.patient_name}</p>
                      <p className="text-xs text-gray-400">{b.doctors?.name} · {b.departments?.name_en}</p>
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
              {todayBookings.length > 8 && (
                <p className="text-xs text-gray-400 text-center">+{todayBookings.length - 8} more</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
