import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { motion } from 'framer-motion'
import { CalendarDays, Clock } from 'lucide-react'

const DAYS = [
  { name: 'Sunday', num: 0 },
  { name: 'Monday', num: 1 },
  { name: 'Tuesday', num: 2 },
  { name: 'Wednesday', num: 3 },
  { name: 'Thursday', num: 4 },
  { name: 'Friday', num: 5 },
  { name: 'Saturday', num: 6 },
]

export default function DoctorSchedule() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [doctor, setDoctor] = useState(null)
  const [weekBookings, setWeekBookings] = useState([])
  const [selectedDay, setSelectedDay] = useState(() => {
    return new Date().getDay()
  })
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

      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const startDate = weekStart.toISOString().slice(0, 10)
      const endDate = weekEnd.toISOString().slice(0, 10)

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, departments(name_en)')
        .eq('doctor_id', doctorData.id)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .order('booking_date')
        .order('slot_time')

      if (!ignore) { setWeekBookings(bookings || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [user?.id])

  const getDayDate = (dayNum) => {
    const today = new Date()
    const diff = dayNum - today.getDay()
    const date = new Date(today)
    date.setDate(today.getDate() + diff)
    return date.toISOString().slice(0, 10)
  }

  const dayDate = getDayDate(selectedDay)
  const dayBookings = weekBookings.filter(b => b.booking_date === dayDate)
  const isWorkingDay = doctor?.working_days?.includes(selectedDay)

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/doctor" subtitle="Weekly Schedule" />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
            {DAYS.map(day => {
              const date = getDayDate(day.num)
              const count = weekBookings.filter(b => b.booking_date === date).length
              const isToday = date === new Date().toISOString().slice(0, 10)
              const isSelected = selectedDay === day.num
              return (
                <motion.button key={day.num} onClick={() => setSelectedDay(day.num)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center min-w-[70px] py-3 px-2 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'
                  }`}>
                  <span className="text-xs font-medium">{day.name.slice(0, 3)}</span>
                  <span className={`text-lg font-bold ${isToday ? 'text-blue-500' : ''}`}>{new Date(date).getDate()}</span>
                  {count > 0 && <span className="text-[10px] mt-0.5">{count} appts</span>}
                </motion.button>
              )
            })}
          </div>

          {!isWorkingDay && (
            <div className="card p-6 mb-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-700 font-medium flex items-center gap-2"><CalendarDays size={16} /> Not a working day</p>
              <p className="text-xs text-yellow-600 mt-1">Your working days: {doctor?.working_days?.map(d => DAYS[d]?.name?.slice(0, 3)).filter(Boolean).join(', ')}</p>
            </div>
          )}

          <div className="card p-6">
            <h2 className="font-display text-base font-bold text-gray-900 mb-4">
              {DAYS[selectedDay]?.name} — {dayBookings.length} appointments
            </h2>
            {dayBookings.length === 0 ? (
              <p className="text-gray-400 text-center py-6">No appointments scheduled</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {dayBookings.map(b => (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(249,250,251,1)' }} whileTap={{ scale: 0.99 }}
                    className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[55px]">
                        <p className="text-sm font-bold text-blue-600 flex items-center gap-1"><Clock size={12} />{b.slot_time}</p>
                      </div>
                      <div className="border-l border-gray-200 pl-3">
                        <p className="font-semibold text-gray-900 text-sm">{b.patient_name}</p>
                        <p className="text-xs text-gray-400">{b.phone} · {b.departments?.name_en}</p>
                      </div>
                    </div>
                    <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                      {b.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
