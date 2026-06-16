import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useLogout } from '../../hooks/useLogout'
import { calcEndTime } from '../../utils/booking'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, CheckCircle, Stethoscope } from 'lucide-react'

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const handleLogout = useLogout('/login')

  const [doctor, setDoctor] = useState(null)
  const [todayBookings, setTodayBookings] = useState([])
  const [stats, setStats] = useState({ today: 0, active: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (ignore || !doctorData) { setLoading(false); return }
      setDoctor(doctorData)

      const today = new Date().toISOString().slice(0, 10)

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, departments(name_en)')
        .eq('doctor_id', doctorData.id)
        .eq('booking_date', today)
        .order('slot_time', { ascending: true })

      if (!ignore) {
        const all = bookings || []
        setTodayBookings(all)
        setStats({
          today: all.length,
          active: all.filter(b => b.status === 'active').length,
          completed: all.filter(b => b.status === 'completed').length,
        })
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [user?.id])

  const handleComplete = async (id) => {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', id)
    setTodayBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b))
    setStats(prev => ({ ...prev, active: prev.active - 1, completed: prev.completed + 1 }))
  }

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" subtitle="Doctor Dashboard" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard"
        subtitle={`Dr. ${doctor?.name || profile?.full_name || 'Doctor'}`}
        right={
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm">Overview</button>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">Logout</button>
          </div>
        }
      />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <motion.div className="card p-6" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-3 mb-2">
                <CalendarDays size={18} className="text-gray-400" />
                <p className="text-xs text-gray-400">Today's Appointments</p>
              </div>
              <p className="font-display text-5xl font-extrabold text-gray-800 leading-none">{stats.today}</p>
            </motion.div>
            <motion.div className="card p-6 bg-green-50 border-green-200" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-3 mb-2">
                <Stethoscope size={18} className="text-green-600" />
                <p className="text-xs text-green-600">Active</p>
              </div>
              <p className="font-display text-5xl font-extrabold text-green-600 leading-none">{stats.active}</p>
            </motion.div>
            <motion.div className="card p-6 bg-blue-50 border-blue-200" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle size={18} className="text-blue-600" />
                <p className="text-xs text-blue-600">Completed</p>
              </div>
              <p className="font-display text-5xl font-extrabold text-blue-600 leading-none">{stats.completed}</p>
            </motion.div>
          </div>
        </motion.div>

        <div className="card p-6 mb-6">
          <h2 className="font-display text-base font-bold text-gray-900 mb-5">Today's Schedule</h2>

          {todayBookings.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No appointments today</p>
          ) : (
            <div className="flex flex-col gap-3">
              {todayBookings.map(b => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(249,250,251,1)' }} whileTap={{ scale: 0.99 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-bold text-blue-600">{b.slot_time}</p>
                      <p className="text-xs text-gray-400">{calcEndTime(b.slot_time)}</p>
                    </div>
                    <div className="border-l border-gray-200 pl-4">
                      <p className="font-bold text-gray-900 text-sm">{b.patient_name}</p>
                      <p className="text-xs text-gray-400">{b.phone} · Queue #{b.queue_number}</p>
                      <p className="text-xs text-gray-400">{b.departments?.name_en}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                      {b.status}
                    </span>
                    {b.status === 'active' && (
                      <button
                        onClick={() => navigate(`/doctor/consultation/${b.id}`)}
                        className="btn btn-primary btn-sm text-xs"
                      >
                        Consult
                      </button>
                    )}
                    {b.status === 'active' && (
                      <button
                        onClick={() => handleComplete(b.id)}
                        className="btn btn-ghost btn-sm text-green-600 text-xs"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
